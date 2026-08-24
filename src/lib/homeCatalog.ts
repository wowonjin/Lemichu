import type { HomeCategoryContent } from "@/data/homeCategories";
import { filterByCategory } from "@/lib/productFilter";
import type { Product } from "@/types/product";

export type TimeSaleProduct = Product & {
  remainingQty: number;
  wishCount: number;
};

export type HomeCategoryItem = {
  id: string;
  label: string;
  href: string;
  imageSrc: string;
};

export type HomeTabProducts<Id extends string> = {
  id: Id;
  label: string;
  shortLabel?: string;
  audience?: string;
  rangeLabel?: string;
  hint: string;
  products: Product[];
};

function uniqueById(products: Product[]) {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

export function pickHeroProducts(products: Product[]): Product[] {
  const wallet = filterByCategory("wallets", products)[0];
  const bag = filterByCategory("women-bags", products).find((product) => product.price < 4_000_000);
  const watch = filterByCategory("watches", products).find((product) => product.price < 8_000_000);
  const jewelry = filterByCategory("jewelry", products)[0];
  return uniqueById([wallet, bag, watch, jewelry].filter((product): product is Product => Boolean(product))).slice(0, 4);
}

export function getHomeCategoryItems(categories: HomeCategoryContent[]): HomeCategoryItem[] {
  return [...categories]
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      imageSrc: item.imageSrc,
    }));
}
