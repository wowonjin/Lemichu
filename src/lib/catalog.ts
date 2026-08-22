import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { getDiscountRate } from "@/lib/formatPrice";
import {
  getAudiencePickTabs,
  getHomeCategoryItems,
  getPriceBandTabs,
  getTrendStories,
  pickTimeSaleProducts,
} from "@/lib/homeCatalog";
import { getPublishedHomeCategories } from "@/lib/home-categories-server";
import type { StoreProduct } from "@/lib/products";
import { getTodaySaleEndIso } from "@/lib/saleWindow";
import type { Product, RankedProduct } from "@/types/product";

type ProductDoc = StoreProduct & {
  color?: string;
  size?: string;
  isPreOwned?: boolean;
  todayShip?: boolean;
  storeCategoryId?: string;
};

function toMillis(value: unknown) {
  if (!value || typeof value !== "object") return 0;

  const timestamp = value as {
    toMillis?: () => number;
    seconds?: number;
    _seconds?: number;
  };

  if (typeof timestamp.toMillis === "function") {
    try {
      return timestamp.toMillis();
    } catch {
      // Admin Timestamp can throw if `this` is detached.
    }
  }

  const seconds = timestamp.seconds ?? timestamp._seconds;
  return typeof seconds === "number" ? seconds * 1000 : 0;
}

function imageUrlFor(product: ProductDoc) {
  return (
    product.representativeImage?.original.url ||
    product.representativeImage?.thumbnail.url ||
    product.representativeImageUrl
  );
}

export function storeProductToProduct(product: ProductDoc): Product {
  const retailPrice =
    typeof product.retailPrice === "number" && product.retailPrice > 0
      ? product.retailPrice
      : undefined;
  const isPreOwned = Boolean(product.isPreOwned);
  const deliveryBadge: Product["deliveryBadge"] = product.todayShip
    ? "오늘출고"
    : product.stockQuantity > 0
      ? product.deliveryFee > 0
        ? "해외배송"
        : "국내배송"
      : "예약배송";
  const badges = [
    "검수완료",
    deliveryBadge,
    isPreOwned ? "중고" : null,
    product.naverSync?.status === "synced" ? "네이버연동" : null,
    retailPrice && retailPrice > product.salePrice ? "가격하락" : null,
  ].filter((badge): badge is string => Boolean(badge));

  return {
    id: product.id,
    brand: product.brand,
    name: product.name,
    imageUrl: imageUrlFor(product),
    imageUrls: [imageUrlFor(product), ...(product.optionalImageUrls ?? [])].filter(Boolean),
    price: product.salePrice,
    retailPrice,
    discountRate: getDiscountRate(product.salePrice, retailPrice),
    color: product.color,
    size: product.size,
    detailContent: product.detailContent,
    condition: isPreOwned ? "A" : undefined,
    isPreOwned,
    categoryId: product.storeCategoryId,
    authenticationStatus: "VERIFIED",
    deliveryBadge,
    badges,
    href: `/product/${product.id}`,
    stockQuantity: product.stockQuantity,
    availability:
      product.stockQuantity > 0 ? "available" : "temporarily_unavailable",
  };
}

async function loadRegisteredProducts(): Promise<Product[]> {
  try {
    const snapshot = await getAdminDb().collection("products").get();
    return snapshot.docs
      .map((doc) => {
        const data = doc.data() as Omit<ProductDoc, "id">;
        return {
          product: storeProductToProduct({ ...data, id: doc.id }),
          createdAt: toMillis(data.createdAt),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(({ product }) => product)
      .filter((product) => Boolean(product.imageUrl));
  } catch (error) {
    console.error("[catalog] failed to load registered products", error);
    return [];
  }
}

const getCachedRegisteredProducts = unstable_cache(
  loadRegisteredProducts,
  ["catalog-registered-products-v3"],
  { revalidate: 30, tags: ["products"] }
);

const fetchRegisteredProducts = cache(() => getCachedRegisteredProducts());

export const getCatalogProducts = cache(async () => {
  const registered = await fetchRegisteredProducts();
  return registered;
});

export const getCatalogProductById = cache(async (id: string) => {
  const products = await getCatalogProducts();
  return products.find((product) => product.id === id);
});

export const getHomeProductSets = cache(async () => {
  const registered = await fetchRegisteredProducts();
  return {
    todaysDeals: registered.slice(0, 12),
    preOwnedVerified: registered.filter((product) => product.isPreOwned).slice(0, 12),
    readyToShip: registered
      .filter((product) => product.deliveryBadge !== "예약배송")
      .slice(0, 12),
    priceDrops: registered
      .filter((product) => product.discountRate !== undefined)
      .slice(0, 12),
  };
});

export const getHomePageData = cache(async () => {
  const [products, categories] = await Promise.all([
    getCatalogProducts(),
    getPublishedHomeCategories(),
  ]);

  return {
    categoryItems: getHomeCategoryItems(categories),
    timeSaleProducts: pickTimeSaleProducts(products, 6),
    timeSaleEndsAt: getTodaySaleEndIso(),
    rankedProducts: await getRankedProducts(18),
    audienceTabs: getAudiencePickTabs(products),
    priceBandTabs: getPriceBandTabs(products),
    trendStories: getTrendStories(products),
  };
});

export const getNewArrivalProducts = cache(async () => {
  return fetchRegisteredProducts();
});

export const getSaleProducts = cache(async () => {
  const registered = await fetchRegisteredProducts();
  return registered.filter((product) => product.discountRate !== undefined);
});

export const getPreOwnedProducts = cache(async () => {
  const registered = await fetchRegisteredProducts();
  return registered.filter((product) => product.isPreOwned);
});

export const getRankedProducts = cache(async (limit = 24): Promise<RankedProduct[]> => {
  const products = await getCatalogProducts();
  const used = products.filter((product) => product.isPreOwned);
  const selected: Product[] = [];
  const seen = new Set<string>();

  for (const product of [...products.slice(0, limit), ...used.slice(0, 8)]) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    selected.push(product);
    if (selected.length >= Math.max(limit, 12)) break;
  }

  const trends: Array<number | "new"> = [3, "new", 2, 0, 1, "new", 2, 0];

  return selected.map((product, index) => ({
    ...product,
    rank: index + 1,
    trend: trends[index % trends.length],
  }));
});
