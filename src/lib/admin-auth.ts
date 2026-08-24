import { getAdminAuth } from "@/lib/firebase-admin";

const ADMIN_EMAIL = "admin@gmail.com";

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

export async function getVerifiedAdmin(request: Request): Promise<VerifiedAdmin | null> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (token) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      if (!isAdminEmail(decoded.email) || !decoded.email) return null;
      return { uid: decoded.uid, email: decoded.email };
    } catch {
      return null;
    }
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
