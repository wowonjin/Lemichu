import { getProductKind } from "@/lib/productKind";
import type { Product } from "@/types/product";

export const PRODUCTS_PATH = "/products";

export const CATALOG_FILTERS = [
  { id: "all", label: "전체" },
  { id: "new", label: "신규입고" },
  { id: "bags", label: "명품가방" },
  { id: "wallets", label: "지갑·카드지갑" },
  { id: "sale", label: "SALE" },
] as const;

export type CatalogFilterId = (typeof CATALOG_FILTERS)[number]["id"];

const NEW_ARRIVAL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const NEW_ARRIVAL_FALLBACK_COUNT = 24;

export function parseCatalogFilter(value: string | null | undefined): CatalogFilterId {
  if (value === "new" || value === "bags" || value === "wallets" || value === "sale") return value;
  return "all";
}

export function catalogFilterHref(filter: CatalogFilterId) {
  return filter === "all" ? PRODUCTS_PATH : `${PRODUCTS_PATH}?filter=${filter}`;
}

export function catalogFilterTitle(filter: CatalogFilterId) {
  if (filter === "all") return "전체 상품";
  return CATALOG_FILTERS.find((item) => item.id === filter)?.label ?? "전체 상품";
}

export function isBagProduct(product: Product) {
  if (product.categoryId === "women-bags" || product.categoryId === "men-bags") return true;
  const kind = getProductKind(product);
  return kind === "women-bag" || kind === "men-bag";
}

export function isWalletProduct(product: Product) {
  if (product.categoryId === "wallets") return true;
  return getProductKind(product) === "wallet";
}

export function isSaleProduct(product: Product) {
  return typeof product.discountRate === "number" && product.discountRate > 0;
}

export function isNewArrivalProduct(product: Product, now = Date.now()) {
  return typeof product.createdAt === "number" && product.createdAt > 0
    ? now - product.createdAt <= NEW_ARRIVAL_WINDOW_MS
    : false;
}

export function filterCatalogProducts(
  products: Product[],
  filter: CatalogFilterId,
  now = Date.now()
) {
  if (filter === "all") return products;
  if (filter === "bags") return products.filter(isBagProduct);
  if (filter === "wallets") return products.filter(isWalletProduct);
  if (filter === "sale") return products.filter(isSaleProduct);

  const recent = products.filter((product) => isNewArrivalProduct(product, now));
  if (recent.length >= 8) return recent;
  return products.slice(0, NEW_ARRIVAL_FALLBACK_COUNT);
}
