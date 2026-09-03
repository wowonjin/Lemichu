import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { createdAtMs, toIso, toPlain } from "@/lib/admin-serialize";
import { getAdminDb } from "@/lib/firebase-admin";
import { resolveMemberGrade } from "@/lib/member-account";
import { toSafePoints } from "@/lib/points";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const snapshot = await getAdminDb().collection("users").get();
    const users = snapshot.docs
      .map((doc) => {
        const data = toPlain(doc.data()) as Record<string, unknown>;
        return {
          uid: doc.id,
          name: typeof data.name === "string" ? data.name : "",
          email: typeof data.email === "string" ? data.email : "",
          phone: typeof data.phone === "string" ? data.phone : undefined,
          provider:
            data.provider === "google" ||
            data.provider === "naver" ||
            data.provider === "kakao"
              ? data.provider
              : "email",
          role: data.role === "admin" ? "admin" : "member",
          photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
          points: toSafePoints(data.points),
          grade: resolveMemberGrade(data.grade),
          createdAt: toIso(doc.get("createdAt")),
          lastLoginAt: toIso(doc.get("lastLoginAt")),
          updatedAt: toIso(doc.get("updatedAt")),
          _sortMs: createdAtMs(doc.get("lastLoginAt") ?? doc.get("createdAt")),
        };
      })
      .sort((a, b) => b._sortMs - a._sortMs)
      .map(({ _sortMs, ...user }) => user);

    return NextResponse.json({ ok: true, users, count: users.length });
  } catch (error) {
    console.error("[admin/users] failed to list users", error);
    return NextResponse.json(
      { ok: false, message: "회원 목록을 불러오지 못했어요." },
      { status: 500 }
    );
  }
}
