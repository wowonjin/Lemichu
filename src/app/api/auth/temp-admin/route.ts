import { NextResponse } from "next/server";

const DEFAULT_ADMIN_EMAIL = "admin@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "admin";

function normalizeEmail(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const normalizedEmail = normalizeEmail(email);
  const envEmail = normalizeEmail(process.env.LEMICHU_ADMIN_EMAIL);
  const envPassword = process.env.LEMICHU_ADMIN_PASSWORD?.trim();

  const isDefaultAdmin =
    normalizedEmail === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD;
  const isEnvAdmin = Boolean(
    envEmail && envPassword && normalizedEmail === envEmail && password === envPassword
  );

  if (!isDefaultAdmin && !isEnvAdmin) {
    return NextResponse.json(
      { message: "auth/invalid-credential" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: {
      uid: "temp-admin",
      name: "관리자",
      email: normalizedEmail || DEFAULT_ADMIN_EMAIL,
      provider: "email",
      role: "admin",
    },
  });
}
