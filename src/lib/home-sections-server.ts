import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  HOME_SECTION_SLOT_COLLECTION,
  isHomeSectionId,
  isHomeSlotMode,
  type HomeSlotOverride,
} from "@/lib/home-sections";

function asOverride(id: string, data: Record<string, unknown>): HomeSlotOverride | null {
  const sectionId = typeof data.sectionId === "string" ? data.sectionId : id.split(":")[0];
  const productIds = Array.isArray(data.productIds)
    ? data.productIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];

  if (!isHomeSectionId(sectionId)) return null;

  return {
    slotId: id,
    sectionId,
    mode: isHomeSlotMode(data.mode) ? data.mode : "auto",
    productIds,
  };
}

async function loadHomeSectionSlots(): Promise<HomeSlotOverride[]> {
  try {
    const snapshot = await getAdminDb().collection(HOME_SECTION_SLOT_COLLECTION).get();
    return snapshot.docs
      .map((doc) => asOverride(doc.id, doc.data() as Record<string, unknown>))
      .filter((item): item is HomeSlotOverride => Boolean(item));
  } catch (error) {
    console.error("[home-sections] failed to load slot overrides", error);
    return [];
  }
}

const getCachedHomeSectionSlots = unstable_cache(loadHomeSectionSlots, ["home-section-slots-v1"], {
  revalidate: 15,
  tags: ["home-sections"],
});

export const getHomeSectionSlotMap = cache(async () => {
  const slots = await getCachedHomeSectionSlots();
  return new Map(slots.map((slot) => [slot.slotId, slot]));
});

export async function saveHomeSectionSlot(input: HomeSlotOverride) {
  await getAdminDb()
    .collection(HOME_SECTION_SLOT_COLLECTION)
    .doc(input.slotId)
    .set(
      {
        sectionId: input.sectionId,
        mode: input.mode,
        productIds: input.productIds,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}
