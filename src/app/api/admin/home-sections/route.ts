import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getHomeMerchandisingPreview } from "@/lib/catalog";
import { homeSectionMeta } from "@/data/homeSectionAlgorithms";
import { catalogCardsFromScored } from "@/lib/home-merchandising";
import {
  homeSlotDocId,
  isHomeSectionId,
  isHomeSlotMode,
  type HomeSectionId,
} from "@/lib/home-sections";
import { saveHomeSectionSlot } from "@/lib/home-sections-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const merch = await getHomeMerchandisingPreview();
    const slotById = new Map(merch.slots.map((slot) => [slot.slotId, slot]));

    const sections = homeSectionMeta.map((section) => ({
      ...section,
      slots: section.slots.map((slot) => {
        const resolved = slotById.get(homeSlotDocId(section.id, slot.key));
        return {
          ...slot,
          slotId: homeSlotDocId(section.id, slot.key),
          mode: resolved?.mode ?? "auto",
          autoItems: resolved?.autoItems ?? [],
          resolvedItems: resolved?.resolvedItems ?? [],
        };
      }),
    }));

    return NextResponse.json({
      ok: true,
      sections,
      catalog: catalogCardsFromScored(merch.scored),
    });
  } catch (error) {
    console.error("[admin/home-sections] failed to load", error);
    return NextResponse.json(
      { ok: false, message: "홈 섹션 데이터를 불러오지 못했어요." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let payload: {
    sectionId?: string;
    slotKey?: string;
    mode?: string;
    productIds?: unknown;
  };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ ok: false, message: "요청 본문을 해석하지 못했어요." }, { status: 400 });
  }

  const sectionId = payload.sectionId;
  const slotKey = typeof payload.slotKey === "string" ? payload.slotKey.trim() : "";
  if (!isHomeSectionId(sectionId ?? "") || !slotKey || !isHomeSlotMode(payload.mode)) {
    return NextResponse.json({ ok: false, message: "섹션 정보가 올바르지 않아요." }, { status: 400 });
  }

  const productIds = Array.isArray(payload.productIds)
    ? payload.productIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];

  try {
    await saveHomeSectionSlot({
      slotId: homeSlotDocId(sectionId as HomeSectionId, slotKey),
      sectionId: sectionId as HomeSectionId,
      mode: payload.mode,
      productIds,
    });

    revalidateTag("home-sections", "max");
    revalidatePath("/");
    revalidatePath("/products");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/home-sections] failed to save", error);
    return NextResponse.json({ ok: false, message: "홈 섹션을 저장하지 못했어요." }, { status: 500 });
  }
}
