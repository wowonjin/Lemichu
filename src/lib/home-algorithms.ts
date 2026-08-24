import { getProductKind, type ProductKind } from "@/lib/productKind";
import type { ProductSignals } from "@/lib/home-sections";
import type { ConditionGrade, Product } from "@/types/product";

export const COLD_START_PRIOR = 8;
export const DISCOUNT_HALF_SATURATION = 0.18;
export const RECENCY_HALF_LIFE_DAYS = 21;
export const TREND_HALF_LIFE_DAYS = 14;
export const MMR_LAMBDA = 0.72;
export const WILSON_Z = 1.96;

export const CONTENT_WEIGHTS = {
  discount: 0.35,
  recency: 0.3,
  availability: 0.2,
  condition: 0.15,
} as const;

export const BEHAVIOR_WEIGHTS = {
  views: 0.45,
  wishes: 0.25,
  sales: 0.2,
  recency: 0.1,
} as const;

export const BEHAVIOR_BLEND = {
  popularity: 0.7,
  wilson: 0.3,
} as const;

export type ScoreBreakdown = {
  score: number;
  lambda: number;
  content: number;
  behavior: number;
  popularity: number;
  wilson: number;
  views: number;
  wishes: number;
  sales: number;
  discountRate: number;
  ageDays: number;
  extras: Record<string, number>;
};

export type ScoredProduct = {
  product: Product;
  breakdown: ScoreBreakdown;
};

export type AlgorithmVariable = {
  symbol: string;
  meaning: string;
};

export type AlgorithmDoc = {
  id: string;
  name: string;
  inspiredBy: string[];
  summary: string;
  formula: string;
  variables: AlgorithmVariable[];
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function log1pSafe(value: number) {
  return Math.log1p(Math.max(0, value));
}

export function recencyDecay(ageDays: number, halfLifeDays: number) {
  return Math.pow(0.5, Math.max(0, ageDays) / halfLifeDays);
}

export function michaelisMenten(value: number, halfSaturation: number) {
  const safe = Math.max(0, value);
  return safe / (safe + halfSaturation);
}

/** Reddit/Amazon 랭킹에 쓰는 Wilson score lower bound. */
export function wilsonLowerBound(successes: number, trials: number, z = WILSON_Z) {
  if (trials <= 0) return 0;
  const p = clamp01(successes / trials);
  const z2 = z * z;
  const denom = 1 + z2 / trials;
  const center = p + z2 / (2 * trials);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * trials)) / trials);
  return clamp01((center - margin) / denom);
}

export function productAgeDays(product: Product, now = Date.now()) {
  if (!product.createdAt) return 30;
  return Math.max(0, (now - product.createdAt) / 86_400_000);
}

function conditionScore(product: Product) {
  const grade: ConditionGrade | undefined = product.condition;
  if (grade === "NEW") return 1;
  if (grade === "S") return 0.88;
  if (grade === "A") return 0.72;
  if (grade === "B") return 0.55;
  return product.isPreOwned ? 0.72 : 0.9;
}

function availabilityScore(product: Product) {
  if (product.availability === "sold") return 0.12;
  if (product.availability === "temporarily_unavailable") return 0.4;
  const stock = product.stockQuantity ?? 1;
  if (stock <= 0) return 0.2;
  return 1;
}

function discountRatio(product: Product) {
  return clamp01((product.discountRate ?? 0) / 100);
}

export function minMaxNormalize(values: number[]) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max <= min) return values.map(() => 1);
  return values.map((value) => (value - min) / (max - min));
}

export function catalogSimilarity(a: Product, b: Product) {
  if (a.id === b.id) return 1;
  if (a.brand.trim().toLowerCase() === b.brand.trim().toLowerCase()) return 1;
  if (getProductKind(a) === getProductKind(b)) return 0.4;
  return 0;
}

export function selectWithMmr(
  items: ScoredProduct[],
  limit: number,
  similarity = catalogSimilarity,
  lambda = MMR_LAMBDA
): ScoredProduct[] {
  if (items.length <= limit) return items;

  const norms = minMaxNormalize(items.map((item) => item.breakdown.score));
  const remaining = items.map((item, index) => ({ item, norm: norms[index] ?? 0 }));
  const selected: ScoredProduct[] = [];

  while (selected.length < limit && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index];
      const maxSim =
        selected.length === 0
          ? 0
          : Math.max(...selected.map((picked) => similarity(candidate.item.product, picked.product)));
      const mmr = lambda * candidate.norm - (1 - lambda) * maxSim;
      if (mmr > bestScore) {
        bestScore = mmr;
        bestIndex = index;
      }
    }

    const [next] = remaining.splice(bestIndex, 1);
    if (!next) break;
    selected.push({
      ...next.item,
      breakdown: {
        ...next.item.breakdown,
        extras: { ...next.item.breakdown.extras, mmr: Number(bestScore.toFixed(4)) },
      },
    });
  }

  return selected;
}

export function scoreProduct(
  product: Product,
  signals: ProductSignals,
  now = Date.now()
): ScoredProduct {
  const views = Math.max(0, signals.viewCount);
  const wishes = Math.max(0, signals.wishCount);
  const sales = Math.max(0, signals.salesCount);
  const n = views + wishes + sales;
  const lambda = COLD_START_PRIOR / (COLD_START_PRIOR + n);
  const ageDays = productAgeDays(product, now);
  const recency = recencyDecay(ageDays, RECENCY_HALF_LIFE_DAYS);
  const discountHat = michaelisMenten(discountRatio(product), DISCOUNT_HALF_SATURATION);

  const content = clamp01(
    CONTENT_WEIGHTS.discount * discountHat +
      CONTENT_WEIGHTS.recency * recency +
      CONTENT_WEIGHTS.availability * availabilityScore(product) +
      CONTENT_WEIGHTS.condition * conditionScore(product)
  );

  const popularityRaw =
    BEHAVIOR_WEIGHTS.views * log1pSafe(views) +
    BEHAVIOR_WEIGHTS.wishes * log1pSafe(wishes) +
    BEHAVIOR_WEIGHTS.sales * log1pSafe(sales) +
    BEHAVIOR_WEIGHTS.recency * recency;
  const popularity = michaelisMenten(popularityRaw, 1.2);
  const wilson = wilsonLowerBound(wishes + sales, views + wishes + sales);
  const behavior = clamp01(BEHAVIOR_BLEND.popularity * popularity + BEHAVIOR_BLEND.wilson * wilson);
  const score = clamp01(lambda * content + (1 - lambda) * behavior);

  return {
    product,
    breakdown: {
      score,
      lambda,
      content,
      behavior,
      popularity,
      wilson,
      views,
      wishes,
      sales,
      discountRate: product.discountRate ?? 0,
      ageDays,
      extras: { recency, discountHat },
    },
  };
}

export function scoreCatalog(products: Product[], signalMap: Map<string, ProductSignals>, now = Date.now()) {
  return products
    .map((product) =>
      scoreProduct(product, signalMap.get(product.id) ?? { viewCount: 0, wishCount: 0, salesCount: 0 }, now)
    )
    .sort((a, b) => b.breakdown.score - a.breakdown.score);
}

export function rankingTrend(item: ScoredProduct): number | "new" {
  if (item.breakdown.ageDays < 14) return "new";
  if (item.breakdown.behavior > item.breakdown.content + 0.08) return 2;
  if (item.breakdown.score >= 0.55) return 1;
  return 0;
}

export function timeSaleScore(item: ScoredProduct) {
  const stock = Math.max(0, item.product.stockQuantity ?? 0);
  if ((item.breakdown.discountRate ?? 0) <= 0 || stock <= 0 || item.product.availability === "sold") {
    return 0;
  }

  const discountHat = michaelisMenten(item.breakdown.discountRate / 100, DISCOUNT_HALF_SATURATION);
  const scarcity = 1 / (1 + stock);
  const score =
    discountHat *
    (1 + 0.25 * log1pSafe(item.breakdown.wishes)) *
    (1 + 0.35 * scarcity) *
    (1 + 0.2 * item.breakdown.popularity);

  return {
    score,
    extras: { discountHat, scarcity },
  };
}

export function audienceBonus(product: Product, tabId: string) {
  const kind = getProductKind(product);
  if (tabId === "first-luxury") {
    return 0.06 + (product.price < 1_800_000 ? 0.04 : 0);
  }
  if (tabId === "office") {
    return kind === "women-bag" || kind === "men-bag" || kind === "watch" ? 0.07 : 0.02;
  }
  if (tabId === "gift") {
    return kind === "wallet" || kind === "jewelry" || kind === "shoes" ? 0.08 : 0;
  }
  if (tabId === "classic") {
    const premium = product.price >= 2_500_000 ? 0.06 : 0;
    const grade = product.condition === "NEW" || product.condition === "S" ? 0.04 : 0;
    return 0.03 + premium + grade;
  }
  return 0;
}

export function priceBandCenterScore(product: Product, minPrice?: number, maxPrice?: number) {
  const low = minPrice ?? Math.max(0, product.price * 0.6);
  const high = maxPrice ?? product.price * 1.4;
  const width = Math.max(1, high - low);
  const center = (low + high) / 2;
  return 1 - Math.min(1, Math.abs(product.price - center) / width);
}

export function trendMatchScore(product: Product, keywords: string[]) {
  if (keywords.length === 0) return 0;
  const hay = `${product.brand} ${product.name}`.toLowerCase();
  const hits = keywords.filter((keyword) => hay.includes(keyword.toLowerCase())).length;
  return hits / keywords.length;
}

export function isKindEligible(product: Product, kinds: ProductKind[]) {
  return kinds.includes(getProductKind(product));
}
