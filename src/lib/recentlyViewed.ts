import type { Product } from "@/types/product";

const STORAGE_KEY = "lemichu.recentlyViewed";
const MAX_ITEMS = 24;
export const RECENTLY_VIEWED_CHANGE = "lemichu-recently-viewed-change";

export type RecentlyViewedItem = {
  productId: string;
  viewedAt: number;
};

function sanitize(value: unknown): RecentlyViewedItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is RecentlyViewedItem => {
      return Boolean(
        item &&
          typeof item === "object" &&
          typeof (item as RecentlyViewedItem).productId === "string" &&
          typeof (item as RecentlyViewedItem).viewedAt === "number"
      );
    })
    .sort((a, b) => b.viewedAt - a.viewedAt)
    .slice(0, MAX_ITEMS);
}

export function readRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];

  try {
    return sanitize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function addRecentlyViewed(productId: string) {
  if (typeof window === "undefined" || !productId) return readRecentlyViewed();

  const next = sanitize([
    { productId, viewedAt: Date.now() },
    ...readRecentlyViewed().filter((item) => item.productId !== productId),
  ]);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_CHANGE, { detail: next }));
  return next;
}

export function resolveRecentlyViewedProducts(products: Product[]) {
  const byId = new Map(products.map((product) => [product.id, product]));
  return readRecentlyViewed()
    .map((item) => {
      const product = byId.get(item.productId);
      return product ? { product, viewedAt: item.viewedAt } : null;
    })
    .filter((item): item is { product: Product; viewedAt: number } => Boolean(item));
}
