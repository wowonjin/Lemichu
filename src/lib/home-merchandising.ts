import {
  audiencePicks,
  priceBands,
  trendStories,
  type AudiencePickId,
  type PriceBandId,
} from "@/data/homeContent";
import { homeSectionMeta } from "@/data/homeSectionAlgorithms";
import {
  audienceBonus,
  isKindEligible,
  priceBandCenterScore,
  rankingTrend,
  recencyDecay,
  scoreCatalog,
  selectWithMmr,
  timeSaleScore,
  TREND_HALF_LIFE_DAYS,
  trendMatchScore,
  type ScoredProduct,
} from "@/lib/home-algorithms";
import type { HomeTabProducts, TimeSaleProduct } from "@/lib/homeCatalog";
import {
  homeSlotDocId,
  type HomeSectionId,
  type HomeSlotOverride,
  type ProductSignals,
} from "@/lib/home-sections";
import type { Product, RankedProduct } from "@/types/product";

export type MerchProductCard = {
  id: string;
  brand: string;
  name: string;
  imageUrl: string;
  href: string;
  price: number;
  discountRate?: number;
  isPreOwned: boolean;
  score: number;
  breakdown: ScoredProduct["breakdown"];
};

export type ResolvedSlot = {
  slotId: string;
  sectionId: HomeSectionId;
  slotKey: string;
  label: string;
  mode: "auto" | "manual";
  limit: number;
  autoItems: MerchProductCard[];
  resolvedItems: MerchProductCard[];
};

function toCard(item: ScoredProduct): MerchProductCard {
  return {
    id: item.product.id,
    brand: item.product.brand,
    name: item.product.name,
    imageUrl: item.product.imageUrl,
    href: item.product.href,
    price: item.product.price,
    discountRate: item.product.discountRate,
    isPreOwned: item.product.isPreOwned,
    score: Number(item.breakdown.score.toFixed(4)),
    breakdown: item.breakdown,
  };
}

function overrideFor(
  overrides: Map<string, HomeSlotOverride>,
  sectionId: HomeSectionId,
  slotKey: string
) {
  return overrides.get(homeSlotDocId(sectionId, slotKey));
}

function scoredById(items: ScoredProduct[]) {
  return new Map(items.map((item) => [item.product.id, item]));
}

function resolveSlotItems(
  autoItems: ScoredProduct[],
  catalogById: Map<string, ScoredProduct>,
  override: HomeSlotOverride | undefined,
  limit: number
): { mode: "auto" | "manual"; items: ScoredProduct[] } {
  if (override?.mode === "manual" && override.productIds.length > 0) {
    const items = override.productIds
      .map((id) => catalogById.get(id))
      .filter((item): item is ScoredProduct => Boolean(item))
      .slice(0, limit);
    if (items.length > 0) {
      return { mode: "manual", items };
    }
  }

  return { mode: "auto", items: autoItems.slice(0, limit) };
}

function pickTimeSale(scored: ScoredProduct[], limit: number) {
  const items: ScoredProduct[] = [];

  for (const item of scored) {
    const sale = timeSaleScore(item);
    if (!sale || sale.score <= 0) continue;
    items.push({
      ...item,
      breakdown: {
        ...item.breakdown,
        score: sale.score,
        extras: { ...item.breakdown.extras, ...sale.extras },
      },
    });
  }

  return items.sort((a, b) => b.breakdown.score - a.breakdown.score).slice(0, limit);
}

function pickRanking(scored: ScoredProduct[], preOwnedOnly: boolean, limit: number) {
  const pool = preOwnedOnly ? scored.filter((item) => item.product.isPreOwned) : scored;
  return pool.slice(0, limit);
}

function pickAudience(scored: ScoredProduct[], tabId: AudiencePickId, limit: number) {
  const tab = audiencePicks.find((item) => item.id === tabId);
  if (!tab) return [];

  const candidates = scored
    .filter((item) => {
      if (!isKindEligible(item.product, tab.kinds)) return false;
      if (tab.maxPrice && item.product.price > tab.maxPrice) return false;
      if (tab.minPrice && item.product.price < tab.minPrice) return false;
      return true;
    })
    .map((item) => {
      const bonus = audienceBonus(item.product, tabId);
      return {
        ...item,
        breakdown: {
          ...item.breakdown,
          score: item.breakdown.score + bonus,
          extras: { ...item.breakdown.extras, audienceBonus: bonus },
        },
      };
    })
    .sort((a, b) => b.breakdown.score - a.breakdown.score);

  return selectWithMmr(candidates, limit);
}

function pickPriceBand(scored: ScoredProduct[], tabId: PriceBandId, limit: number) {
  const tab = priceBands.find((item) => item.id === tabId);
  if (!tab) return [];

  const candidates = scored
    .filter((item) => {
      if (tab.preOwnedOnly && !item.product.isPreOwned) return false;
      if (tab.minPrice && item.product.price < tab.minPrice) return false;
      if (tab.maxPrice && item.product.price > tab.maxPrice) return false;
      return true;
    })
    .map((item) => {
      const center = priceBandCenterScore(item.product, tab.minPrice, tab.maxPrice);
      const discountHat = item.breakdown.extras.discountHat ?? 0;
      const utility = 0.4 * item.breakdown.score + 0.35 * center + 0.25 * discountHat;
      return {
        ...item,
        breakdown: {
          ...item.breakdown,
          score: utility,
          extras: { ...item.breakdown.extras, center, utility },
        },
      };
    })
    .sort((a, b) => b.breakdown.score - a.breakdown.score);

  return selectWithMmr(candidates, limit);
}

function pickTrend(scored: ScoredProduct[], storyId: string, limit: number) {
  const story = trendStories.find((item) => item.id === storyId);
  if (!story) return [];

  const matched = scored
    .map((item) => {
      const tf = trendMatchScore(item.product, story.match);
      const recency = recencyDecay(item.breakdown.ageDays, TREND_HALF_LIFE_DAYS);
      const score = 0.5 * tf + 0.3 * recency + 0.2 * item.breakdown.score;
      return {
        ...item,
        breakdown: {
          ...item.breakdown,
          score,
          extras: { ...item.breakdown.extras, tf, trendRecency: recency },
        },
      };
    })
    .sort((a, b) => b.breakdown.score - a.breakdown.score);

  const withKeyword = matched.filter((item) => (item.breakdown.extras.tf ?? 0) > 0);
  return (withKeyword.length >= 2 ? withKeyword : matched).slice(0, limit);
}

function toTimeSaleProduct(item: ScoredProduct): TimeSaleProduct {
  return {
    ...item.product,
    remainingQty: Math.max(1, Math.min(item.product.stockQuantity ?? 1, 9)),
    wishCount: item.breakdown.wishes,
  };
}

function toRankedProduct(item: ScoredProduct, index: number): RankedProduct {
  return {
    ...item.product,
    rank: index + 1,
    trend: rankingTrend(item),
  };
}

export type HomeMerchandising = {
  scored: ScoredProduct[];
  timeSaleProducts: TimeSaleProduct[];
  rankedAll: RankedProduct[];
  rankedTabs: Array<{ id: "all" | "pre-owned"; label: string; products: RankedProduct[] }>;
  audienceTabs: HomeTabProducts<AudiencePickId>[];
  priceBandTabs: HomeTabProducts<PriceBandId>[];
  trendStories: Array<(typeof trendStories)[number] & { products: Product[] }>;
  slots: ResolvedSlot[];
};

export function buildHomeMerchandising(
  products: Product[],
  signalMap: Map<string, ProductSignals>,
  overrides: Map<string, HomeSlotOverride>,
  now = Date.now()
): HomeMerchandising {
  const scored = scoreCatalog(products, signalMap, now);
  const catalogById = scoredById(scored);
  const slots: ResolvedSlot[] = [];

  const resolve = (sectionId: HomeSectionId, slotKey: string, autoItems: ScoredProduct[]) => {
    const meta = homeSectionMeta.find((section) => section.id === sectionId);
    const slotMeta = meta?.slots.find((slot) => slot.key === slotKey);
    const limit = slotMeta?.limit ?? 8;
    const override = overrideFor(overrides, sectionId, slotKey);
    const resolved = resolveSlotItems(autoItems, catalogById, override, limit);
    slots.push({
      slotId: homeSlotDocId(sectionId, slotKey),
      sectionId,
      slotKey,
      label: slotMeta?.label ?? slotKey,
      mode: resolved.mode,
      limit,
      autoItems: autoItems.slice(0, limit).map(toCard),
      resolvedItems: resolved.items.map(toCard),
    });
    return resolved.items;
  };

  const timeSale = resolve("time-sale", "today", pickTimeSale(scored, 8));
  const rankedAllItems = resolve("ranking", "all", pickRanking(scored, false, 24));
  const rankedUsedItems = resolve("ranking", "pre-owned", pickRanking(scored, true, 24));

  const audienceTabs = audiencePicks.map((tab) => {
    const items = resolve("audience", tab.id, pickAudience(scored, tab.id, 8));
    return {
      id: tab.id,
      label: tab.label,
      shortLabel: tab.shortLabel,
      audience: tab.audience,
      hint: tab.hint,
      products: items.map((item) => item.product),
    };
  });

  const priceBandTabs = priceBands.map((tab) => {
    const items = resolve("price-band", tab.id, pickPriceBand(scored, tab.id, 8));
    return {
      id: tab.id,
      label: tab.label,
      shortLabel: tab.shortLabel,
      rangeLabel: tab.rangeLabel,
      hint: tab.hint,
      products: items.map((item) => item.product),
    };
  });

  const stories = trendStories.map((story) => {
    const items = resolve("trend", story.id, pickTrend(scored, story.id, 6));
    return {
      ...story,
      products: items.map((item) => item.product),
    };
  });

  return {
    scored,
    timeSaleProducts: timeSale.map(toTimeSaleProduct),
    rankedAll: rankedAllItems.map(toRankedProduct),
    rankedTabs: [
      {
        id: "all",
        label: "전체",
        products: rankedAllItems.slice(0, 8).map(toRankedProduct),
      },
      {
        id: "pre-owned",
        label: "중고",
        products: rankedUsedItems.slice(0, 8).map(toRankedProduct),
      },
    ],
    audienceTabs,
    priceBandTabs,
    trendStories: stories,
    slots,
  };
}

export function catalogCardsFromScored(scored: ScoredProduct[]): MerchProductCard[] {
  return scored.map(toCard);
}
