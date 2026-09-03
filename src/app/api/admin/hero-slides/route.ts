import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { heroSlides as defaultHeroSlides } from "@/data/campaigns";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const COLLECTION = "heroSlides";

function defaultStoreHeroSlides() {
  return defaultHeroSlides.map((slide, index) => ({
    ...slide,
    dark: Boolean(slide.dark),
    visible: true,
    order: index,
  }));
}

function mapSlide(id: string, data: Record<string, unknown>) {
  return {
    id,
    eyebrow: String(data.eyebrow ?? ""),
    title: String(data.title ?? ""),
    subtitle: String(data.subtitle ?? ""),
    ctaLabel: String(data.ctaLabel ?? ""),
    ctaHref: String(data.ctaHref ?? "/"),
    image: String(data.image ?? ""),
    dark: Boolean(data.dark),
    visible: data.visible !== false,
    order: typeof data.order === "number" ? data.order : 0,
  };
}

async function listSlides() {
  const snapshot = await getAdminDb().collection(COLLECTION).get();
  return snapshot.docs
    .map((doc) => mapSlide(doc.id, doc.data() as Record<string, unknown>))
    .sort((a, b) => a.order - b.order);
}

export async function GET(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const slides = await listSlides();
    return NextResponse.json({ ok: true, slides, count: slides.length });
  } catch (error) {
    console.error("[admin/hero-slides] failed to list", error);
    return NextResponse.json(
      { ok: false, message: "슬라이드를 불러오지 못했어요." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let body: {
    action?: string;
    ids?: string[];
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
    const db = getAdminDb();

    if (body.action === "seed") {
      const existing = await listSlides();
      if (existing.length > 0) {
        return NextResponse.json({ ok: true, slides: existing });
      }
      const batch = db.batch();
      for (const slide of defaultStoreHeroSlides()) {
        const ref = db.collection(COLLECTION).doc();
        batch.set(ref, {
          eyebrow: slide.eyebrow,
          title: slide.title,
          subtitle: slide.subtitle,
          ctaLabel: slide.ctaLabel,
          ctaHref: slide.ctaHref,
          image: slide.image,
          dark: slide.dark,
          visible: slide.visible,
          order: slide.order,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      return NextResponse.json({ ok: true, slides: await listSlides() });
    }

    if (body.action === "reorder") {
      const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string") : [];
      const batch = db.batch();
      ids.forEach((id, order) => {
        batch.update(db.collection(COLLECTION).doc(id), {
          order,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
      return NextResponse.json({ ok: true, slides: await listSlides() });
    }

    if (!String(body.title ?? "").trim()) {
      return NextResponse.json({ ok: false, message: "제목을 입력해주세요." }, { status: 400 });
    }

    const ref = await db.collection(COLLECTION).add({
      eyebrow: String(body.eyebrow ?? ""),
      title: String(body.title ?? "").trim(),
      subtitle: String(body.subtitle ?? ""),
      ctaLabel: String(body.ctaLabel ?? "자세히 보기"),
      ctaHref: String(body.ctaHref ?? "/"),
      image: String(body.image ?? ""),
      dark: Boolean(body.dark),
      visible: body.visible !== false,
      order: Number(body.order ?? 0),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, id: ref.id, slides: await listSlides() });
  } catch (error) {
    console.error("[admin/hero-slides] failed to write", error);
    return NextResponse.json(
      { ok: false, message: "슬라이드를 저장하지 못했어요." },
      { status: 500 }
    );
  }
}
