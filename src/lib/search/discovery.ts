import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  popularKeywords,
  recommendedKeywords,
  searchCategoryShortcuts,
} from "@/data/searchKeywords";
import { getCatalogProducts } from "@/lib/catalog";
import { getAdminDb } from "@/lib/firebase-admin";
import { filterByCategory } from "@/lib/productFilter";
import { brandHrefForSearch } from "@/lib/search/brands";
import type {
  PopularSearchItem,
  SearchCategoryShortcut,
  SearchDiscoveryPayload,
  SearchSuggestion,
} from "@/lib/search/types";
import type { Product } from "@/types/product";

const DISCOVERY_CATEGORY_SHORTCUTS: SearchCategoryShortcut[] = [
  { label: "여성가방", href: "/category/women-bags" },
  { label: "남성가방", href: "/category/men-bags" },
  { label: "지갑", href: "/category/wallets" },
  { label: "시계", href: "/category/watches" },
  { label: "주얼리", href: "/category/jewelry" },
  { label: "중고명품", href: "/pre-owned" },
];

const RECOMMENDED_CATEGORY_TERMS = [
  { keyword: "중고명품", test: (products: Product[]) => products.some((product) => product.isPreOwned) },
  { keyword: "가방", test: (products: Product[]) => hasCategory(products, "women-bags") || hasCategory(products, "men-bags") },
  { keyword: "시계", test: (products: Product[]) => hasCategory(products, "watches") },
  { keyword: "지갑", test: (products: Product[]) => hasCategory(products, "wallets") },
  { keyword: "주얼리", test: (products: Product[]) => hasCategory(products, "jewelry") },
] as const;

function hasCategory(products: Product[], categoryId: string) {
  return filterByCategory(categoryId, products).length > 0;
}

function toIso(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const timestamp = value as { toDate?: () => Date; toMillis?: () => number; seconds?: number; _seconds?: number };

  try {
    if (typeof timestamp.toDate === "function") return timestamp.toDate().toISOString();
    if (typeof timestamp.toMillis === "function") return new Date(timestamp.toMillis()).toISOString();
  } catch {
    // Admin Timestamp can throw if `this` is detached.
  }

  const seconds = timestamp.seconds ?? timestamp._seconds;
  return typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;
}

function uniqueKeywords(values: Array<string | undefined>, limit: number) {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const value of values) {
    const keyword = value?.trim();
    if (!keyword) continue;
    const key = keyword.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(keyword);
    if (next.length >= limit) break;
  }

  return next;
}

function uniquePopularItems(values: PopularSearchItem[], limit: number) {
  const seen = new Set<string>();
  const next: PopularSearchItem[] = [];

  for (const item of values) {
    const keyword = item.keyword.trim();
    if (!keyword) continue;
    const key = keyword.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push({ keyword, count: item.count });
    if (next.length >= limit) break;
  }

  return next;
}

function catalogBrandCounts(products: Product[]) {
  const counts = new Map<string, { name: string; count: number }>();

  for (const product of products) {
    const name = product.brand.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const current = counts.get(key);
    if (current) current.count += 1;
    else counts.set(key, { name, count: 1 });
  }

  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ko"));
}

function normalizePopularItems(value: unknown): PopularSearchItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") {
        const keyword = item.trim();
        return keyword ? { keyword, count: 0 } : null;
      }
      if (!item || typeof item !== "object") return null;
      const record = item as { keyword?: unknown; count?: unknown };
      const keyword = typeof record.keyword === "string" ? record.keyword.trim() : "";
      if (!keyword) return null;
      return {
        keyword,
        count: typeof record.count === "number" && record.count > 0 ? record.count : 0,
      };
    })
    .filter((item): item is PopularSearchItem => Boolean(item))
    .slice(0, 10);
}

async function loadCustomerPopular(): Promise<{
  items: PopularSearchItem[];
  updatedAt: string | null;
} | null> {
  try {
    const db = getAdminDb();
    const stats = await db.collection("searchStats").doc("popular").get();
    if (stats.exists) {
      const data = stats.data() ?? {};
      const items = normalizePopularItems(data.items);
      if (items.length > 0) {
        return { items, updatedAt: toIso(data.updatedAt) };
      }
    }

    const counters = await db.collection("searchCounters").orderBy("count", "desc").limit(10).get();
    const items = counters.docs
      .map((doc) => {
        const data = doc.data();
        const keyword = typeof data.keyword === "string" ? data.keyword.trim() : "";
        return keyword
          ? { keyword, count: typeof data.count === "number" ? data.count : 0 }
          : null;
      })
      .filter((item): item is PopularSearchItem => Boolean(item));

    if (items.length === 0) return null;

    const latest = counters.docs
      .map((doc) => toIso(doc.data().lastSearchedAt))
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1);

    return { items, updatedAt: latest ?? null };
  } catch (error) {
    console.error("[search] failed to load popular searches", error);
    return null;
  }
}

function buildRecommended(products: Product[], popular: PopularSearchItem[]) {
  const brandNames = catalogBrandCounts(products).map((item) => item.name);
  const categoryTerms = RECOMMENDED_CATEGORY_TERMS.filter((item) => item.test(products)).map(
    (item) => item.keyword
  );

  return uniqueKeywords(
    [...brandNames.slice(0, 5), ...categoryTerms, ...popular.map((item) => item.keyword), ...recommendedKeywords],
    10
  );
}

function buildCategories(products: Product[]) {
  if (products.length === 0) return searchCategoryShortcuts;

  return DISCOVERY_CATEGORY_SHORTCUTS.filter((item) => {
    if (item.href === "/pre-owned") return products.some((product) => product.isPreOwned);
    const categoryId = item.href.replace("/category/", "");
    return hasCategory(products, categoryId);
  });
}

function buildDiscoveryPayload(
  products: Product[],
  customerPopular: { items: PopularSearchItem[]; updatedAt: string | null } | null
): SearchDiscoveryPayload {
  const catalogBrands = catalogBrandCounts(products);
  const customerItems = customerPopular?.items ?? [];
  const popularSource: SearchDiscoveryPayload["popularSource"] = customerItems.length
    ? "customers"
    : catalogBrands.length > 0
      ? "catalog"
      : "fallback";

  const resolvedPopular = uniquePopularItems(
    [
      ...customerItems,
      ...catalogBrands.map((item) => ({ keyword: item.name, count: item.count })),
      ...popularKeywords.map((keyword) => ({ keyword, count: 0 })),
    ],
    10
  );

  return {
    recommended: buildRecommended(products, resolvedPopular),
    popular: resolvedPopular,
    popularUpdatedAt: customerPopular?.updatedAt ?? new Date().toISOString(),
    popularSource,
    categories: buildCategories(products),
    brands: catalogBrands.slice(0, 20).map((item) => ({
      name: item.name,
      href: brandHrefForSearch(item.name),
    })),
  };
}

async function loadSearchDiscovery(): Promise<SearchDiscoveryPayload> {
  const [products, customerPopular] = await Promise.all([
    getCatalogProducts().catch(() => [] as Product[]),
    loadCustomerPopular(),
  ]);

  return buildDiscoveryPayload(products, customerPopular);
}

const getCachedSearchDiscovery = unstable_cache(loadSearchDiscovery, ["search-discovery-v3"], {
  revalidate: 30,
  tags: ["search-discovery"],
});

export const getSearchDiscovery = cache(() => getCachedSearchDiscovery());

export async function getSearchSuggestions(query: string, usedOnly = false): Promise<SearchSuggestion[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const products = (await getCatalogProducts()).filter((product) => (usedOnly ? product.isPreOwned : true));
  const seen = new Set<string>();
  const suggestions: SearchSuggestion[] = [];

  const push = (item: SearchSuggestion) => {
    const key = `${item.type}:${item.label.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push(item);
  };

  for (const product of products) {
    if (product.brand.toLowerCase().includes(normalized)) {
      push({
        label: product.brand,
        href: brandHrefForSearch(product.brand, usedOnly),
        type: "brand",
      });
    }
    if (suggestions.length >= 7) break;
  }

  for (const product of products) {
    if (!product.name.toLowerCase().includes(normalized)) continue;
    push({
      label: product.name,
      href: product.href,
      type: "product",
    });
    if (suggestions.length >= 7) break;
  }

  return suggestions;
}
