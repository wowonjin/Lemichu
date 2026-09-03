import { NextResponse } from "next/server";
import {
  KAKAO_FIREBASE_TOKEN_COOKIE,
  KAKAO_OAUTH_REDIRECT_COOKIE,
  KAKAO_OAUTH_STATE_COOKIE,
} from "@/lib/kakao-login/config";

const oauthCookieMaxAge = 60 * 10;
const tokenCookieMaxAge = 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function applyKakaoOAuthCookies(
  response: NextResponse,
  state: string,
  redirectPath: string
) {
  response.cookies.set(KAKAO_OAUTH_STATE_COOKIE, state, cookieOptions(oauthCookieMaxAge));
  response.cookies.set(
    KAKAO_OAUTH_REDIRECT_COOKIE,
    redirectPath,
    cookieOptions(oauthCookieMaxAge)
  );
  return response;
}

export function clearKakaoOAuthCookies(response: NextResponse) {
  response.cookies.delete(KAKAO_OAUTH_STATE_COOKIE);
  response.cookies.delete(KAKAO_OAUTH_REDIRECT_COOKIE);
  return response;
}

export function applyKakaoFirebaseTokenCookie(response: NextResponse, token: string) {
  response.cookies.set(
    KAKAO_FIREBASE_TOKEN_COOKIE,
    token,
    cookieOptions(tokenCookieMaxAge)
  );
  return response;
}

export function clearKakaoFirebaseTokenCookie(response: NextResponse) {
  response.cookies.delete(KAKAO_FIREBASE_TOKEN_COOKIE);
  return response;
}
