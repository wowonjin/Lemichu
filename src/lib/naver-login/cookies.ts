import { NextResponse } from "next/server";
import {
  NAVER_FIREBASE_TOKEN_COOKIE,
  NAVER_OAUTH_REDIRECT_COOKIE,
  NAVER_OAUTH_STATE_COOKIE,
} from "@/lib/naver-login/config";

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

export function applyNaverOAuthCookies(
  response: NextResponse,
  state: string,
  redirectPath: string
) {
  response.cookies.set(NAVER_OAUTH_STATE_COOKIE, state, cookieOptions(oauthCookieMaxAge));
  response.cookies.set(
    NAVER_OAUTH_REDIRECT_COOKIE,
    redirectPath,
    cookieOptions(oauthCookieMaxAge)
  );
  return response;
}

export function clearNaverOAuthCookies(response: NextResponse) {
  response.cookies.delete(NAVER_OAUTH_STATE_COOKIE);
  response.cookies.delete(NAVER_OAUTH_REDIRECT_COOKIE);
  return response;
}

export function applyNaverFirebaseTokenCookie(response: NextResponse, token: string) {
  response.cookies.set(
    NAVER_FIREBASE_TOKEN_COOKIE,
    token,
    cookieOptions(tokenCookieMaxAge)
  );
  return response;
}

export function clearNaverFirebaseTokenCookie(response: NextResponse) {
  response.cookies.delete(NAVER_FIREBASE_TOKEN_COOKIE);
  return response;
}
