export const HOME_SECTION_SLOT_COLLECTION = "homeSectionSlots";
export const PRODUCT_SIGNAL_COLLECTION = "productSignals";

export type HomeSectionId = "time-sale" | "ranking" | "audience" | "price-band" | "trend";
export type HomeSlotMode = "auto" | "manual";

export type HomeSlotOverride = {
  slotId: string;
  sectionId: HomeSectionId;
  mode: HomeSlotMode;
  productIds: string[];
};

export type ProductSignals = {
  viewCount: number;
  wishCount: number;
  salesCount: number;
  lastViewedAt?: number;
};

export const EMPTY_PRODUCT_SIGNALS: ProductSignals = {
  viewCount: 0,
  wishCount: 0,
  salesCount: 0,
};

export function homeSlotDocId(sectionId: HomeSectionId, slotKey: string) {
  return `${sectionId}:${slotKey}`;
}

export function parseHomeSlotDocId(id: string): { sectionId: HomeSectionId; slotKey: string } | null {
  const [sectionId, ...rest] = id.split(":");
  const slotKey = rest.join(":");
  if (!isHomeSectionId(sectionId) || !slotKey) return null;
  return { sectionId, slotKey };
}

export function isHomeSectionId(value: string): value is HomeSectionId {
  return (
    value === "time-sale" ||
    value === "ranking" ||
    value === "audience" ||
    value === "price-band" ||
    value === "trend"
  );
}

export function isHomeSlotMode(value: unknown): value is HomeSlotMode {
  return value === "auto" || value === "manual";
}
