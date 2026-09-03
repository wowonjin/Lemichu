import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { KAKAO_FIREBASE_TOKEN_COOKIE } from "@/lib/kakao-login/config";
import { clearKakaoFirebaseTokenCookie } from "@/lib/kakao-login/cookies";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(KAKAO_FIREBASE_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { message: "카카오 로그인 세션이 만료되었습니다. 다시 시도해주세요." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ token });
  clearKakaoFirebaseTokenCookie(response);
  return response;
}
