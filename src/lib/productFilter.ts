import { allProducts } from "@/data/mockProducts";
import type { Product } from "@/types/product";

/**
 * Lightweight, deterministic front-end filtering over the mock catalog.
 * These helpers are intentionally heuristic (keyword based) because the demo
 * catalog has no structured category/brand foreign keys.
 */

const categoryKeywords: Record<string, string[]> = {
  "women-bags": ["백", "토트", "숄더", "클러치", "호보", "체인", "플랩", "가방"],
  "men-bags": ["서류", "백팩", "메신저", "브리프", "비즈니스"],
  wallets: ["월릿", "월렛", "지갑", "woc", "카드"],
  shoes: ["스니커", "로퍼", "샌들", "부츠", "슈즈", "힐", "펌프스", "드라이빙"],
  watches: ["워치", "데이저스트", "시계", "오이스터", "롤렉스"],
  jewelry: ["브레이슬릿", "목걸이", "반지", "주얼리", "러브", "다이아"],
  apparel: ["자켓", "코트", "니트", "셔츠", "원피스", "티셔츠", "가디건", "패딩"],
};

function haystack(product: Product): string {
  return `${product.brand} ${product.name} ${product.color ?? ""} ${product.size ?? ""} ${product.badges.join(" ")}`.toLowerCase();
}

export function filterByCategory(categoryId: string, products = allProducts): Product[] {
  const keywords = categoryKeywords[categoryId];
  if (!keywords) return [];
  return products.filter((product) => {
    const hay = haystack(product);
    return keywords.some((keyword) => hay.includes(keyword.toLowerCase()));
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
    const hay = haystack(product);
    return cleaned.some((term) => hay.includes(term));
  });
}

/** A stable set of recommendations used for empty states. */
export function getRecommended(limit = 8, products = allProducts): Product[] {
  return products.slice(0, limit);
}
