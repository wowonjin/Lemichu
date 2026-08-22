import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const tempAdminEmail = process.env.LEMICHU_ADMIN_EMAIL?.trim();
  const tempAdminPassword = process.env.LEMICHU_ADMIN_PASSWORD?.trim();
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!tempAdminEmail || !tempAdminPassword) {
    return NextResponse.json(
      { message: "임시 관리자 계정 설정이 필요합니다." },
      { status: 503 }
    );
  }

  const isValidAdmin =
    email?.trim().toLowerCase() === tempAdminEmail.toLowerCase() &&
    password === tempAdminPassword;

  if (!isValidAdmin) {
    return NextResponse.json(
      { message: "auth/invalid-credential" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: {
      uid: "temp-admin",
      name: "관리자",
      email: tempAdminEmail,
      provider: "email",
      role: "admin",
    },
  });
}
