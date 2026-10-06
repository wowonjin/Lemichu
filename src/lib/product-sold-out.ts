import type { ProductAvailability, ProductVariant } from "@/types/product";

type SoldOutSource = {
  variants?: Array<Partial<ProductVariant>>;
  stockQuantity?: number;
};

export type SoldOutUpdate = {
  availability: ProductAvailability;
  stockQuantity: number;
  variants?: ProductVariant[];
};

/** Marks every option sold out, or restores a sold product to a sellable quantity of 1. */
export function buildSoldOutUpdate(product: SoldOutSource, soldOut: boolean): SoldOutUpdate {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  if (soldOut) {
    return {
      availability: "sold",
      stockQuantity: 0,
      ...(variants.length > 0
        ? {
            variants: variants.map(
              (variant) =>
                ({
                  ...variant,
                  stockStatus: "soldout",
                  quantity: 0,
                }) as ProductVariant
            ),
          }
        : {}),
    };
  }

  if (variants.length === 0) {
    const current = Number(product.stockQuantity);
    return {
      availability: "available",
      stockQuantity: Number.isInteger(current) && current > 0 ? current : 1,
    };
  }

  const nextVariants = variants.map((variant) => {
    const quantity = Number(variant.quantity);
    return {
      ...variant,
      stockStatus: "quantity_managed" as const,
      quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
    } as ProductVariant;
  });

  return {
    availability: "available",
    stockQuantity: nextVariants.reduce((sum, variant) => sum + (variant.quantity ?? 0), 0),
    variants: nextVariants,
  };
}
