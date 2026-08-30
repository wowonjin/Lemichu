import { getProductKind, productHaystack, type ProductKind } from "@/lib/productKind";
import { findBrandByName } from "@/lib/search/brands";
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

const searchTermToCategory: Record<string, string[]> = {
  중고: ["pre-owned"],
  중고명품: ["pre-owned"],
  가방: ["women-bags", "men-bags"],
  여성가방: ["women-bags"],
  "여성 가방": ["women-bags"],
  남성가방: ["men-bags"],
  "남성 가방": ["men-bags"],
  지갑: ["wallets"],
  시계: ["watches"],
  주얼리: ["jewelry"],
  슈즈: ["shoes"],
  신발: ["shoes"],
  의류: ["apparel"],
};

function matchesCategoryTerm(product: Product, term: string) {
  const categoryIds = searchTermToCategory[term];
  if (!categoryIds) return false;
  if (categoryIds.includes("pre-owned")) return product.isPreOwned;
  return categoryIds.some((categoryId) => {
    if (product.categoryId === categoryId) return true;
    const kind = categoryToKind[categoryId];
    return kind ? getProductKind(product) === kind : false;
  });
}

export function filterByCategory(categoryId: string, products: Product[]): Product[] {
  const kind = categoryToKind[categoryId];
  return products.filter((product) => {
    if (product.categoryId) return product.categoryId === categoryId;
    return kind ? getProductKind(product) === kind : false;
  });
}

export function filterByBrand(brandName: string, products: Product[]): Product[] {
  const brand = findBrandByName(brandName);
  const aliases = new Set(
    [brandName, brand?.name, brand?.wordmark, brand?.id.replace(/-/g, " "), ...(brand?.aliases ?? [])]
      .map((value) => value?.trim().toLowerCase())
      .filter((value): value is string => Boolean(value))
  );
  return products.filter((product) => aliases.has(product.brand.trim().toLowerCase()));
}

/**
 * Free-text + faceted search. Any product matching ANY of the provided terms
 * is returned. Empty terms return the full catalog.
 */
export function searchProducts(
  terms: (string | undefined)[],
  products: Product[],
  options?: { usedOnly?: boolean }
): Product[] {
  const cleaned = terms
    .map((term) => term?.trim().toLowerCase())
    .filter((term): term is string => Boolean(term));

  const matched =
    cleaned.length === 0
      ? products
      : products.filter((product) => {
          const hay = productHaystack(product);
          return cleaned.some((term) => hay.includes(term) || matchesCategoryTerm(product, term));
        });

  return options?.usedOnly ? matched.filter((product) => product.isPreOwned) : matched;
}

/** A stable set of recommendations used for empty states. */
export function getRecommended(limit: number, products: Product[]): Product[] {
  return products.slice(0, limit);
}
