import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  let body: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
    image?: string;
    dark?: boolean;
    visible?: boolean;
    order?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: "요청 본문을 해석하지 못했어요." }, { status: 400 });
  }

  try {
    const ref = getAdminDb().collection("heroSlides").doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return NextResponse.json({ ok: false, message: "슬라이드를 찾을 수 없습니다." }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    for (const field of ["eyebrow", "title", "subtitle", "ctaLabel", "ctaHref", "image"] as const) {
      if (typeof body[field] === "string") updates[field] = body[field];
    }
    if (typeof body.dark === "boolean") updates.dark = body.dark;
    if (typeof body.visible === "boolean") updates.visible = body.visible;
    if (typeof body.order === "number") updates.order = body.order;

    await ref.update(updates);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/hero-slides] failed to update", error);
    return NextResponse.json(
      { ok: false, message: "슬라이드를 저장하지 못했어요." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const ref = getAdminDb().collection("heroSlides").doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return NextResponse.json({ ok: false, message: "슬라이드를 찾을 수 없습니다." }, { status: 404 });
    }
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/hero-slides] failed to delete", error);
    return NextResponse.json(
      { ok: false, message: "슬라이드를 삭제하지 못했어요." },
      { status: 500 }
    );
  }
}
