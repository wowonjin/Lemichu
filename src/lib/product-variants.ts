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

export function getVariantLabel(variant: ProductVariant): string {
  return [variant.color, variant.size].filter(Boolean).join(" / ") || "단일 옵션";
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
