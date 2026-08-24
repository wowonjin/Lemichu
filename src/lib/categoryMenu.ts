import {
  categoryMenuTabs,
  type CategoryMenuColumnDef,
  type CategoryMenuItemDef,
  type CategoryMenuTab,
} from "@/data/categoryMenu";
import { getProductKind, productHaystack } from "@/lib/productKind";
import type { Product } from "@/types/product";

const columnByCategoryId: Record<string, string> = {
  apparel: "의류",
  "women-bags": "가방",
  "men-bags": "가방",
  wallets: "액세서리",
  watches: "액세서리",
  jewelry: "액세서리",
  shoes: "신발",
};

const columnByKind: Record<string, string> = {
  apparel: "의류",
  "women-bag": "가방",
  "men-bag": "가방",
  wallet: "액세서리",
  watch: "액세서리",
  jewelry: "액세서리",
  shoes: "신발",
};

function categoryText(product: Product) {
  return productHaystack(product)
    .replace(/[+\s]*([가-힣a-z0-9/]+)\s*포함/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasKeyword(hay: string, keyword: string) {
  const target = keyword.toLowerCase();
  if (!hay.includes(target)) return false;
  if (target === "셔츠") return !hay.includes("티셔츠");
  if (target === "반지") return /반지(?!갑)/.test(hay);
  return true;
}

function isUsedListedProduct(product: Product) {
  return product.isPreOwned && (product.availability ?? "available") === "available";
}

function productMenuTabs(product: Product): Array<"여성" | "남성"> {
  const hay = categoryText(product);
  const female = /(여성|우먼|women|ladies)/i.test(hay);
  const male = !female && /(남성|맨즈|\bmen\b|이클립스)/i.test(hay);

  if (product.categoryId === "men-bags" || male) return ["남성"];
  if (product.categoryId === "women-bags" || female) return ["여성"];

  const kind = getProductKind(product);
  if (kind === "men-bag") return ["남성"];
  if (kind === "women-bag") return ["여성"];

  return ["여성"];
}

export function productMenuColumn(product: Product): string | null {
  if (product.categoryId && columnByCategoryId[product.categoryId]) {
    return columnByCategoryId[product.categoryId];
  }
  return columnByKind[getProductKind(product)] ?? null;
}

function itemMatchesProduct(item: CategoryMenuItemDef, hay: string) {
  if (item.fallback || item.keywords.length === 0) return false;
  return item.keywords.some((keyword) => hasKeyword(hay, keyword));
}

function matchingItems(column: CategoryMenuColumnDef, product: Product) {
  const hay = categoryText(product);
  const matched = column.items.filter((item) => itemMatchesProduct(item, hay));
  if (matched.length > 0) return matched.map((item) => item.label);

  const fallback = column.items.find((item) => item.fallback);
  return fallback ? [fallback.label] : [];
}

export function productMatchesMenu(
  product: Product,
  options: { tab?: string; category?: string; item?: string }
) {
  if (!isUsedListedProduct(product)) return false;

  const tabs = productMenuTabs(product);
  if (options.tab && !tabs.includes(options.tab as "여성" | "남성")) return false;

  const columnTitle = productMenuColumn(product);
  if (options.category && columnTitle !== options.category) return false;

  if (!options.item) return true;

  const tabDef = categoryMenuTabs.find((tab) => tab.label === (options.tab || tabs[0]));
  const columnDef =
    tabDef?.columns.find((column) => column.title === (options.category || columnTitle)) ??
    categoryMenuTabs.flatMap((tab) => tab.columns).find((column) => column.title === (options.category || columnTitle));

  if (!columnDef) return false;
  return matchingItems(columnDef, product).includes(options.item);
}

export function filterProductsByCategoryMenu(
  products: Product[],
  options: { tab?: string; category?: string; item?: string }
) {
  return products.filter((product) => productMatchesMenu(product, options));
}

export function buildAvailableCategoryMenu(products: Product[]): CategoryMenuTab[] {
  const used = products.filter(isUsedListedProduct);

  return categoryMenuTabs
    .map((tab) => {
      const columns = tab.columns
        .map((column) => {
          const items = column.items
            .filter((item) =>
              used.some((product) =>
                productMatchesMenu(product, {
                  tab: tab.label,
                  category: column.title,
                  item: item.label,
                })
              )
            )
            .map((item) => item.label);

          return items.length > 0 ? { title: column.title, items } : null;
        })
        .filter((column): column is { title: string; items: string[] } => Boolean(column));

      return columns.length > 0 ? { label: tab.label, columns } : null;
    })
    .filter((tab): tab is CategoryMenuTab => Boolean(tab));
}
