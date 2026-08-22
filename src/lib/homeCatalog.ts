import type { HomeCategoryContent } from "@/data/homeCategories";
import {
  audiencePicks,
  priceBands,
  trendStories,
  type AudiencePickId,
  type PriceBandId,
} from "@/data/homeContent";
import { hashBetween } from "@/lib/saleWindow";
import { filterByCategory } from "@/lib/productFilter";
import { productMatchesAnyKind } from "@/lib/productKind";
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

export function pickTimeSaleProducts(products: Product[], limit = 6): TimeSaleProduct[] {
  return uniqueById(
    products
      .filter((product) => (product.discountRate ?? 0) > 0)
      .sort((a, b) => (b.discountRate ?? 0) - (a.discountRate ?? 0))
  )
    .slice(0, limit)
    .map((product) => ({
      ...product,
      remainingQty: hashBetween(`${product.id}-qty`, 1, 4),
      wishCount: hashBetween(`${product.id}-wish`, 8, 28),
    }));
}

export function getAudiencePickTabs(products: Product[]): HomeTabProducts<AudiencePickId>[] {
  return audiencePicks.map((tab) => {
    const matched = products.filter((product) => {
      if (!productMatchesAnyKind(product, tab.kinds)) return false;
      if (tab.maxPrice && product.price > tab.maxPrice) return false;
      if (tab.minPrice && product.price < tab.minPrice) return false;
      return true;
    });

    return {
      id: tab.id,
      label: tab.label,
      shortLabel: tab.shortLabel,
      audience: tab.audience,
      hint: tab.hint,
      products: matched.slice(0, 4),
    };
  });
}

function pickPriceBandProducts(products: Product[], limit = 4) {
  const sorted = [...products].sort((a, b) => a.price - b.price);
  const picked: Product[] = [];
  const usedBrands = new Set<string>();

  for (const product of sorted) {
    if (usedBrands.has(product.brand)) continue;
    usedBrands.add(product.brand);
    picked.push(product);
    if (picked.length === limit) return picked;
  }

  for (const product of sorted) {
    if (picked.some((item) => item.id === product.id)) continue;
    picked.push(product);
    if (picked.length === limit) break;
  }

  return picked;
}

export function getPriceBandTabs(products: Product[]): HomeTabProducts<PriceBandId>[] {
  return priceBands.map((tab) => {
    const matched = products.filter((product) => {
      if (tab.preOwnedOnly && !product.isPreOwned) return false;
      if (tab.minPrice && product.price < tab.minPrice) return false;
      if (tab.maxPrice && product.price > tab.maxPrice) return false;
      return true;
    });

    return {
      id: tab.id,
      label: tab.label,
      shortLabel: tab.shortLabel,
      rangeLabel: tab.rangeLabel,
      hint: tab.hint,
      products: pickPriceBandProducts(matched, 4),
    };
  });
}

export function getTrendStories(products: Product[]) {
  return trendStories.map((story) => {
    const matched = products.filter((product) => {
      const hay = `${product.brand} ${product.name}`.toLowerCase();
      return story.match.some((keyword) => hay.includes(keyword.toLowerCase()));
    });

    return {
      ...story,
      products: (matched.length > 0 ? matched : products).slice(0, 4),
    };
  });
}

