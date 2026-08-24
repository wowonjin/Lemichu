export const SEARCH_SOURCES = [
  "submit",
  "suggestion",
  "popular",
  "recommended",
  "recent",
] as const;

export type SearchSource = (typeof SEARCH_SOURCES)[number];

export type SearchSuggestion = {
  label: string;
  href: string;
  type: "brand" | "product";
};

export type SearchCategoryShortcut = {
  label: string;
  href: string;
};

export type PopularSearchItem = {
  keyword: string;
  count: number;
};

export type SearchDiscoveryPayload = {
  recommended: string[];
  popular: PopularSearchItem[];
  popularUpdatedAt: string | null;
  popularSource: "customers" | "catalog" | "fallback";
  categories: SearchCategoryShortcut[];
  brands: Array<{ name: string; href: string }>;
};
