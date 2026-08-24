import { NextResponse } from "next/server";
import { FirebaseAuthError, requireFirebaseUser } from "@/lib/firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";

export async function requireAccountActor(request: Request) {
  const decoded = await requireFirebaseUser(request);
  const snap = await getAdminDb().collection("users").doc(decoded.uid).get();
  const data = snap.data() ?? {};

  return {
    uid: decoded.uid,
    email: String(decoded.email || data.email || ""),
    name: String(data.name || decoded.name || decoded.email?.split("@")[0] || "회원"),
  };
}

export function accountErrorResponse(error: unknown, fallback: string) {
  if (error instanceof FirebaseAuthError) {
    return NextResponse.json({ ok: false, message: "로그인이 필요해요." }, { status: 401 });
  }
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export function adminForbidden() {
  return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
}
