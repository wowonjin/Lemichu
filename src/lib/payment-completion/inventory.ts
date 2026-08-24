import type { OrderItemSnapshot } from "@/lib/checkout";
import type { ProductVariant } from "@/types/product";

type InventoryProduct = {
  variants?: ProductVariant[];
  stockQuantity?: number;
};

export type InventoryUpdate = {
  variants?: ProductVariant[];
  stockQuantity: number;
};

function availableVariantQuantity(variant: ProductVariant): number {
  if (variant.stockStatus === "soldout") return 0;
  return variant.stockStatus === "quantity_managed" ? Math.max(variant.quantity ?? 0, 0) : 1;
}

export function applyInventoryItems(
  product: InventoryProduct,
  items: Array<Pick<OrderItemSnapshot, "variantId" | "quantity">>
): InventoryUpdate {
  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant) => ({ ...variant }))
    : [];

  if (variants.length === 0) {
    const requested = items.reduce((sum, item) => sum + Math.max(item.quantity, 0), 0);
    const current = Math.max(Number(product.stockQuantity ?? 0), 0);
    if (requested <= 0 || current < requested) {
      throw new Error("INSUFFICIENT_INVENTORY");
    }
    return { stockQuantity: current - requested };
  }

  for (const item of items) {
    const quantity = Math.max(Math.floor(item.quantity), 0);
    const index = variants.findIndex((variant) => variant.id === item.variantId);
    if (quantity <= 0 || index < 0) {
      throw new Error("INVENTORY_VARIANT_NOT_FOUND");
    }

    const variant = variants[index];
    if (!variant || variant.stockStatus === "soldout") {
      throw new Error("INSUFFICIENT_INVENTORY");
    }

    if (variant.stockStatus === "quantity_managed") {
      const current = Math.max(variant.quantity ?? 0, 0);
      if (current < quantity) throw new Error("INSUFFICIENT_INVENTORY");
      const remaining = current - quantity;
      variants[index] = {
        ...variant,
        quantity: remaining,
        stockStatus: remaining === 0 ? "soldout" : "quantity_managed",
      };
    } else {
      if (quantity !== 1) throw new Error("INSUFFICIENT_INVENTORY");
      variants[index] = { ...variant, stockStatus: "soldout", quantity: 0 };
    }
  }

  return {
    variants,
    stockQuantity: variants.reduce(
      (sum, variant) => sum + availableVariantQuantity(variant),
      0
    ),
  };
}
