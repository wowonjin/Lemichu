import type { Product, ProductVariant } from "@/types/product";

export function isVariantAvailable(variant: ProductVariant): boolean {
  if (variant.stockStatus === "soldout") return false;
  if (variant.stockStatus === "quantity_managed") {
    return (variant.quantity ?? 0) > 0;
  }
  return true;
}

export function getVariantPrice(product: Product, variant?: ProductVariant): number {
  return (product.basePrice ?? product.price) + Math.max(variant?.surchargeKrw ?? 0, 0);
}

export function formatSizeDisplayLabel(size?: string | null): string {
  const value = size?.trim() ?? "";
  if (!value) return "단일 사이즈";
  if (/^(f|free|free size|onesize|one size|os|프리|프리사이즈)$/i.test(value)) {
    return "프리 사이즈";
  }
  return value;
}

export function getVariantLabel(variant: ProductVariant): string {
  return [getVariantColorLabel(variant), getVariantSizeLabel(variant)].join(" / ");
}

export function getVariantColorLabel(variant: ProductVariant): string {
  return variant.color?.trim() || "기본 색상";
}

export function getVariantSizeLabel(variant: ProductVariant): string {
  return formatSizeDisplayLabel(variant.size);
}

export function formatVariantMeasurements(variant?: ProductVariant): string {
  if (!variant?.measurements) return "";
  return Object.entries(variant.measurements)
    .map(([label, value]) => `${label} ${/cm$/i.test(value) ? value : `${value}cm`}`)
    .join(" · ");
}

const ALPHA_SIZE_RANK: Record<string, number> = {
  xxs: 10,
  xs: 20,
  s: 30,
  sm: 30,
  m: 40,
  md: 40,
  l: 50,
  lg: 50,
  xl: 60,
  xxl: 70,
  "2xl": 70,
  xxxl: 80,
  "3xl": 80,
  f: 5,
  free: 5,
  "free size": 5,
  onesize: 5,
  "one size": 5,
  os: 5,
  프리: 5,
  프리사이즈: 5,
  "프리 사이즈": 5,
};

function parseSizeNumber(label: string): number | null {
  const match = label.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function compareVariantSizeLabels(a: string, b: string): number {
  const rankA = ALPHA_SIZE_RANK[a.trim().toLowerCase()];
  const rankB = ALPHA_SIZE_RANK[b.trim().toLowerCase()];
  if (rankA != null && rankB != null && rankA !== rankB) return rankA - rankB;

  const numA = parseSizeNumber(a);
  const numB = parseSizeNumber(b);
  if (numA != null && numB != null && numA !== numB) return numA - numB;

  return a.localeCompare(b, "ko");
}

function uniqueInOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

export function getUniqueVariantColors(variants: ProductVariant[]): string[] {
  return uniqueInOrder(variants.map(getVariantColorLabel));
}

export function getUniqueVariantSizes(variants: ProductVariant[]): string[] {
  return uniqueInOrder(variants.map(getVariantSizeLabel)).sort(compareVariantSizeLabels);
}

export function findVariantByOptions(
  variants: ProductVariant[],
  color: string,
  size: string
): ProductVariant | undefined {
  return variants.find(
    (variant) =>
      getVariantColorLabel(variant) === color && getVariantSizeLabel(variant) === size
  );
}

export function getPurchasableVariants(product: Product): ProductVariant[] {
  return (product.variants ?? []).filter(isVariantAvailable);
}

export function getProductAvailabilityFromVariants(
  variants: ProductVariant[] | undefined,
  fallbackStockQuantity: number
): Product["availability"] {
  if (!variants?.length) {
    return fallbackStockQuantity > 0 ? "available" : "temporarily_unavailable";
  }
  return variants.some(isVariantAvailable) ? "available" : "temporarily_unavailable";
}

export function getProductStockFromVariants(
  variants: ProductVariant[] | undefined,
  fallbackStockQuantity: number
): number {
  if (!variants?.length) return fallbackStockQuantity;

  return variants.reduce((total, variant) => {
    if (!isVariantAvailable(variant)) return total;
    return total + (variant.stockStatus === "quantity_managed" ? variant.quantity ?? 0 : 1);
  }, 0);
}
