import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { NAVER_FIREBASE_TOKEN_COOKIE } from "@/lib/naver-login/config";
import { clearNaverFirebaseTokenCookie } from "@/lib/naver-login/cookies";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(NAVER_FIREBASE_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { message: "네이버 로그인 세션이 만료되었습니다. 다시 시도해주세요." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ token });
  clearNaverFirebaseTokenCookie(response);
  return response;
}
