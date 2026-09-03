import { NextResponse } from "next/server";
import { applyAdminSessionCookie } from "@/lib/admin-session";
import { getAdminAuth } from "@/lib/firebase-admin";

const DEFAULT_ADMIN_EMAIL = "admin@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "admin";
const TEMP_ADMIN_UID = "temp-admin";

function normalizeEmail(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

async function createTempAdminCustomToken(email: string) {
  const auth = getAdminAuth();

  try {
    const existing = await auth.getUser(TEMP_ADMIN_UID);
    if (existing.email?.toLowerCase() !== email || existing.disabled) {
      await auth.updateUser(TEMP_ADMIN_UID, {
        email,
        emailVerified: true,
        displayName: "관리자",
        disabled: false,
      });
    }
  } catch {
    await auth.createUser({
      uid: TEMP_ADMIN_UID,
      email,
      emailVerified: true,
      displayName: "관리자",
      disabled: false,
    });
  }

  return auth.createCustomToken(TEMP_ADMIN_UID, {
    role: "admin",
    provider: "email",
  });
}

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const normalizedEmail = normalizeEmail(email) || DEFAULT_ADMIN_EMAIL;
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

  let customToken: string | null = null;
  try {
    customToken = await createTempAdminCustomToken(normalizedEmail);
  } catch {
    // Firebase Admin may be unavailable in some local setups.
    // Cookie session below still authorizes admin APIs in production.
    customToken = null;
  }

  const response = NextResponse.json({
    user: {
      uid: TEMP_ADMIN_UID,
      name: "관리자",
      email: normalizedEmail,
      provider: "email",
      role: "admin",
    },
    customToken,
  });

  applyAdminSessionCookie(response, normalizedEmail);
  return response;
}
