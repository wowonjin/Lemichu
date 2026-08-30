import type { HomeCategoryContent, HomeCategoryId } from "@/data/homeCategories";
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

const HOME_QUICK_BAR: Array<HomeCategoryItem & { sourceId?: HomeCategoryId }> = [
  {
    id: "bags-clutch",
    sourceId: "women-bags",
    label: "가방*클러치",
    href: "/products?filter=bags",
    imageSrc: "/category-images/cat-women-bags-cut.png",
  },
  {
    id: "wallets-card",
    sourceId: "wallets",
    label: "지갑*카드지갑",
    href: "/products?filter=wallets",
    imageSrc: "/category-images/cat-wallets-cut.png",
  },
  {
    id: "sale",
    label: "SALE",
    href: "/products?filter=sale",
    imageSrc: "",
  },
];

export function getHomeCategoryItems(categories: HomeCategoryContent[]): HomeCategoryItem[] {
  const byId = new Map(categories.map((item) => [item.id, item]));

  return HOME_QUICK_BAR.map(({ sourceId, ...item }) => {
    const stored = sourceId ? byId.get(sourceId) : undefined;
    return {
      id: item.id,
      label: item.label,
      href: item.href,
      imageSrc: stored?.imageSrc || item.imageSrc,
    };
  });
}
