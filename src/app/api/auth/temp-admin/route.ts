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
  let uid = TEMP_ADMIN_UID;

  try {
    const byEmail = await auth.getUserByEmail(email);
    uid = byEmail.uid;
    if (byEmail.disabled) {
      await auth.updateUser(uid, { disabled: false, displayName: "관리자" });
    }
  } catch {
    try {
      await auth.getUser(TEMP_ADMIN_UID);
      await auth.updateUser(TEMP_ADMIN_UID, {
        email,
        emailVerified: true,
        displayName: "관리자",
        disabled: false,
      });
      uid = TEMP_ADMIN_UID;
    } catch {
      try {
        await auth.createUser({
          uid: TEMP_ADMIN_UID,
          email,
          emailVerified: true,
          displayName: "관리자",
          disabled: false,
        });
        uid = TEMP_ADMIN_UID;
      } catch {
        // Last resort: let Firebase assign a uid if the preferred one is unavailable.
        const created = await auth.createUser({
          email,
          emailVerified: true,
          displayName: "관리자",
          disabled: false,
        });
        uid = created.uid;
      }
    }
  }

  return {
    uid,
    customToken: await auth.createCustomToken(uid, {
      role: "admin",
      provider: "email",
    }),
  };
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

  let uid = TEMP_ADMIN_UID;
  let customToken: string | null = null;
  try {
    const created = await createTempAdminCustomToken(normalizedEmail);
    uid = created.uid;
    customToken = created.customToken;
  } catch {
    // Firebase Admin may be unavailable. Cookie session still authorizes admin APIs.
    customToken = null;
  }

  const response = NextResponse.json({
    user: {
      uid,
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
