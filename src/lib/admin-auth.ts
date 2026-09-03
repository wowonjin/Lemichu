import { ADMIN_SESSION_COOKIE, verifyAdminSessionValue } from "@/lib/admin-session";
import { getAdminAuth } from "@/lib/firebase-admin";

const ADMIN_EMAIL = "admin@gmail.com";
const TEMP_ADMIN_UID = "temp-admin";

export function isAdminEmail(email: string | undefined | null) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const tempAdminEmail = process.env.LEMICHU_ADMIN_EMAIL?.trim().toLowerCase();
  return normalized === ADMIN_EMAIL || (tempAdminEmail ? normalized === tempAdminEmail : false);
}

export type VerifiedAdmin = {
  uid: string;
  email: string;
};

function readCookieValue(request: Request, name: string) {
  const raw = request.headers.get("cookie") || "";
  const match = raw
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

export async function getVerifiedAdmin(request: Request): Promise<VerifiedAdmin | null> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (token) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      const email = decoded.email?.toLowerCase() || "";
      const role = typeof decoded.role === "string" ? decoded.role : "";
      const isTempAdmin = decoded.uid === TEMP_ADMIN_UID;
      if (!isAdminEmail(email) && !isTempAdmin && role !== "admin") return null;
      return {
        uid: decoded.uid,
        email: email || ADMIN_EMAIL,
      };
    } catch {
      // Fall through to cookie / dev header checks.
    }
  }

  const sessionEmail = verifyAdminSessionValue(
    readCookieValue(request, ADMIN_SESSION_COOKIE)
  );
  if (sessionEmail && isAdminEmail(sessionEmail)) {
    return { uid: TEMP_ADMIN_UID, email: sessionEmail };
  }

  if (process.env.NODE_ENV !== "production") {
    const email = request.headers.get("x-admin-email");
    if (isAdminEmail(email) && email) {
      return { uid: "development-temp-admin", email };
    }
  }
  return null;
}

export async function verifyAdminRequest(request: Request): Promise<boolean> {
  return Boolean(await getVerifiedAdmin(request));
}
