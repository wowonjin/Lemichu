import { allProducts } from "@/data/mockProducts";
import { getProductKind, productHaystack, type ProductKind } from "@/lib/productKind";
import type { Product } from "@/types/product";

const categoryToKind: Record<string, ProductKind> = {
  "women-bags": "women-bag",
  "men-bags": "men-bag",
  wallets: "wallet",
  shoes: "shoes",
  watches: "watch",
  jewelry: "jewelry",
  apparel: "apparel",
};

export function filterByCategory(categoryId: string, products = allProducts): Product[] {
  const kind = categoryToKind[categoryId];
  return products.filter((product) => {
    if (product.categoryId) return product.categoryId === categoryId;
    return kind ? getProductKind(product) === kind : false;
  });
}

export function filterByBrand(brandName: string, products = allProducts): Product[] {
  const target = brandName.trim().toLowerCase();
  return products.filter(
    (product) => product.brand.trim().toLowerCase() === target
  );
}

/**
 * Free-text + faceted search. Any product matching ANY of the provided terms
 * is returned. Empty terms return the full catalog.
 */
export function searchProducts(terms: (string | undefined)[], products = allProducts): Product[] {
  const cleaned = terms
    .map((term) => term?.trim().toLowerCase())
    .filter((term): term is string => Boolean(term));

  if (cleaned.length === 0) return products;

  return products.filter((product) => {
    const hay = productHaystack(product);
    return cleaned.some((term) => hay.includes(term));
  });
}

/** A stable set of recommendations used for empty states. */
export function getRecommended(limit = 8, products = allProducts): Product[] {
  return products.slice(0, limit);
}
