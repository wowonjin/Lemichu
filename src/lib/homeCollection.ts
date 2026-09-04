import {
  audiencePicks,
  priceBands,
  type AudiencePickId,
  type PriceBandId,
} from "@/data/homeContent";
import { isKindEligible } from "@/lib/home-algorithms";
import type { Product } from "@/types/product";

export const AUDIENCE_IDS = [
  "first-luxury",
  "office",
  "gift",
  "classic",
] as const satisfies readonly AudiencePickId[];

export const PRICE_BAND_IDS = [
  "under-200",
  "under-500",
  "under-1000",
  "from-1500",
] as const satisfies readonly PriceBandId[];

export function parseAudienceId(value: string | null | undefined): AudiencePickId | null {
  return AUDIENCE_IDS.includes(value as AudiencePickId) ? (value as AudiencePickId) : null;
}

export function parsePriceBandId(value: string | null | undefined): PriceBandId | null {
  return PRICE_BAND_IDS.includes(value as PriceBandId) ? (value as PriceBandId) : null;
}

export function audienceMoreHref(id: AudiencePickId) {
  return `/products?audience=${id}`;
}

export function priceBandMoreHref(id: PriceBandId) {
  return `/products?band=${id}`;
}

export function rankingMoreHref(id: "all" | "pre-owned") {
  return id === "pre-owned" ? "/products?used=1" : "/products";
}

export function filterProductsByAudience(products: Product[], id: AudiencePickId) {
  const tab = audiencePicks.find((item) => item.id === id);
  if (!tab) return products;

  return products.filter((product) => {
    if (!isKindEligible(product, tab.kinds)) return false;
    if (tab.maxPrice && product.price > tab.maxPrice) return false;
    if (tab.minPrice && product.price < tab.minPrice) return false;
    return true;
  });
}

export function filterProductsByPriceBand(products: Product[], id: PriceBandId) {
  const tab = priceBands.find((item) => item.id === id);
  if (!tab) return products;

  return products.filter((product) => {
    if (tab.preOwnedOnly && !product.isPreOwned) return false;
    if (tab.minPrice && product.price < tab.minPrice) return false;
    if (tab.maxPrice && product.price > tab.maxPrice) return false;
    return true;
  });
}

export function homeCollectionTitle({
  audienceId,
  bandId,
  usedOnly,
  fallback,
}: {
  audienceId: AudiencePickId | null;
  bandId: PriceBandId | null;
  usedOnly: boolean;
  fallback: string;
}) {
  if (audienceId) {
    return audiencePicks.find((item) => item.id === audienceId)?.label ?? fallback;
  }
  if (bandId) {
    return priceBands.find((item) => item.id === bandId)?.label ?? fallback;
  }
  if (usedOnly) return "중고 상품";
  return fallback;
}
