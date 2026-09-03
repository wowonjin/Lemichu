import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "lemichu_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret() {
  return (
    process.env.LEMICHU_ADMIN_SESSION_SECRET?.trim() ||
    process.env.LEMICHU_ADMIN_PASSWORD?.trim() ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim() ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
    "lemichu-admin-session-dev"
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function createAdminSessionValue(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${normalizedEmail}.${expiresAt}`;
  return `${payload}.${signPayload(payload)}`;
}

export function verifyAdminSessionValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [email, expiresAtRaw, signature] = parts;
  if (!email || !expiresAtRaw || !signature) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const payload = `${email}.${expiresAtRaw}`;
  const expected = signPayload(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  return email;
}

export function applyAdminSessionCookie(response: NextResponse, email: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionValue(email),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
