import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/base-url";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import {
  KAKAO_OAUTH_REDIRECT_COOKIE,
  KAKAO_OAUTH_STATE_COOKIE,
} from "@/lib/kakao-login/config";
import {
  applyKakaoFirebaseTokenCookie,
  clearKakaoOAuthCookies,
} from "@/lib/kakao-login/cookies";
import { buildKakaoUid, exchangeKakaoCode, fetchKakaoProfile } from "@/lib/kakao-login/oauth";
import { normalizeRedirectPath } from "@/lib/redirect";

function redirectWithError(baseUrl: string, message: string) {
  const loginUrl = new URL("/login", baseUrl);
  loginUrl.searchParams.set("error", message);
  const response = NextResponse.redirect(loginUrl);
  return clearKakaoOAuthCookies(response);
}

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const oauthError = requestUrl.searchParams.get("error");

  if (oauthError) {
    return redirectWithError(
      baseUrl,
      oauthError === "access_denied"
        ? "카카오 로그인 동의가 취소되었습니다."
        : "카카오 로그인에 실패했습니다."
    );
  }

  if (!code || !state) {
    return redirectWithError(baseUrl, "카카오 로그인 인증 코드가 없습니다.");
  }

  try {
    const jar = await cookies();
    const savedState = jar.get(KAKAO_OAUTH_STATE_COOKIE)?.value;
    const redirectPath = jar.get(KAKAO_OAUTH_REDIRECT_COOKIE)?.value;

    if (!savedState || savedState !== state) {
      return redirectWithError(
        baseUrl,
        "카카오 로그인 요청이 만료되었거나 유효하지 않습니다."
      );
    }

    const callbackUri = `${baseUrl}/api/auth/kakao/callback`;
    const accessToken = await exchangeKakaoCode(code, callbackUri);
    const profile = await fetchKakaoProfile(accessToken);
    const uid = buildKakaoUid(profile.id);
    const displayName =
      profile.name || profile.nickname || profile.email?.split("@")[0] || "카카오 회원";
    const auth = getAdminAuth();

    try {
      await auth.updateUser(uid, {
        displayName,
        ...(profile.email ? { email: profile.email, emailVerified: true } : {}),
        ...(profile.profileImage ? { photoURL: profile.profileImage } : {}),
      });
    } catch (error) {
      const codeName =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "";

      if (codeName === "auth/user-not-found") {
        try {
          await auth.createUser({
            uid,
            displayName,
            ...(profile.email ? { email: profile.email, emailVerified: true } : {}),
            ...(profile.profileImage ? { photoURL: profile.profileImage } : {}),
          });
        } catch (createError) {
          const createCode =
            createError && typeof createError === "object" && "code" in createError
              ? String((createError as { code?: string }).code)
              : "";

          if (createCode === "auth/email-already-exists" && profile.email) {
            await auth.createUser({
              uid,
              displayName,
              ...(profile.profileImage ? { photoURL: profile.profileImage } : {}),
            });
          } else {
            throw createError;
          }
        }
      } else if (codeName === "auth/email-already-exists") {
        await auth.updateUser(uid, {
          displayName,
          ...(profile.profileImage ? { photoURL: profile.profileImage } : {}),
        });
      } else {
        throw error;
      }
    }

    const now = new Date();
    await getAdminDb()
      .collection("users")
      .doc(uid)
      .set(
        {
          uid,
          name: displayName,
          email: profile.email || `${uid.replace(":", "-")}@kakao.local`,
          ...(profile.mobile ? { phone: profile.mobile } : {}),
          provider: "kakao",
          photoURL: profile.profileImage || null,
          role: "member",
          lastLoginAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

    const customToken = await auth.createCustomToken(uid, { provider: "kakao" });
    const completeUrl = new URL("/auth/kakao/complete", baseUrl);
    completeUrl.searchParams.set("redirect", normalizeRedirectPath(redirectPath));

    const response = NextResponse.redirect(completeUrl);
    clearKakaoOAuthCookies(response);
    applyKakaoFirebaseTokenCookie(response, customToken);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "카카오 로그인 처리 중 문제가 발생했습니다.";
    return redirectWithError(baseUrl, message);
  }
}
