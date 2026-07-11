import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/base-url";
import { getNaverLoginConfig, NAVER_AUTHORIZE_URL } from "@/lib/naver-login/config";
import { applyNaverOAuthCookies } from "@/lib/naver-login/cookies";
import { normalizeRedirectPath } from "@/lib/redirect";

export async function GET(request: Request) {
  try {
    const { clientId } = getNaverLoginConfig();
    const requestUrl = new URL(request.url);
    const redirectPath = normalizeRedirectPath(requestUrl.searchParams.get("redirect"));
    const state = randomBytes(24).toString("hex");
    const baseUrl = getBaseUrl(request);
    const callbackUri = `${baseUrl}/api/auth/naver/callback`;

    const authorizeUrl = new URL(NAVER_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", callbackUri);
    authorizeUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authorizeUrl.toString());
    return applyNaverOAuthCookies(response, state, redirectPath);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "네이버 로그인을 시작할 수 없습니다.";
    const baseUrl = getBaseUrl(request);
    const loginUrl = new URL("/login", baseUrl);
    loginUrl.searchParams.set("error", message);

    return NextResponse.redirect(loginUrl);
  }
}
