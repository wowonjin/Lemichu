import "server-only";

import { allProducts, preOwnedVerified, priceDrops, readyToShip, todaysDeals } from "@/data/mockProducts";
import { getAdminDb } from "@/lib/firebase-admin";
import { getDiscountRate } from "@/lib/formatPrice";
import type { StoreProduct } from "@/lib/products";
import type { Product, RankedProduct } from "@/types/product";

type ProductDoc = StoreProduct & {
  color?: string;
  size?: string;
  isPreOwned?: boolean;
};

function toMillis(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value) {
    const toMillisFn = (value as { toMillis?: () => number }).toMillis;
    return typeof toMillisFn === "function" ? toMillisFn() : 0;
  }
  return 0;
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
  const deliveryBadge: Product["deliveryBadge"] =
    product.stockQuantity > 0 ? (product.deliveryFee > 0 ? "해외배송" : "국내배송") : "예약배송";
  const isPreOwned = Boolean(product.isPreOwned);
  const badges = [
    "검수완료",
    deliveryBadge,
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
    authenticationStatus: "VERIFIED",
    deliveryBadge,
    badges,
    href: `/product/${product.id}`,
  };
}

async function fetchRegisteredProducts(): Promise<Product[]> {
  try {
    const snapshot = await getAdminDb().collection("products").get();
    return snapshot.docs
      .map((doc) => storeProductToProduct({ id: doc.id, ...doc.data() } as ProductDoc))
      .sort((a, b) => {
        const aDoc = snapshot.docs.find((doc) => doc.id === a.id)?.data() as ProductDoc | undefined;
        const bDoc = snapshot.docs.find((doc) => doc.id === b.id)?.data() as ProductDoc | undefined;
        return toMillis(bDoc?.createdAt) - toMillis(aDoc?.createdAt);
      });
  } catch {
    return [];
  }
}

function mergeProducts(primary: Product[], fallback: Product[]) {
  const seen = new Set<string>();
  return [...primary, ...fallback].filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

export async function getCatalogProducts() {
  return mergeProducts(await fetchRegisteredProducts(), allProducts);
}

export async function getCatalogProductById(id: string) {
  const products = await getCatalogProducts();
  return products.find((product) => product.id === id);
}

export async function getHomeProductSets() {
  const registered = await fetchRegisteredProducts();
  return {
    todaysDeals: mergeProducts(registered, todaysDeals).slice(0, 12),
    preOwnedVerified: mergeProducts(
      registered.filter((product) => product.isPreOwned),
      preOwnedVerified
    ).slice(0, 12),
    readyToShip: mergeProducts(
      registered.filter((product) => product.deliveryBadge !== "예약배송"),
      readyToShip
    ).slice(0, 12),
    priceDrops: mergeProducts(
      registered.filter((product) => product.discountRate !== undefined),
      priceDrops
    ).slice(0, 12),
  };
}

export async function getNewArrivalProducts() {
  const registered = await fetchRegisteredProducts();
  return mergeProducts(registered, [...readyToShip, ...todaysDeals]);
}

export async function getSaleProducts() {
  const registered = await fetchRegisteredProducts();
  return mergeProducts(
    registered.filter((product) => product.discountRate !== undefined),
    [...priceDrops, ...todaysDeals]
  );
}

export async function getPreOwnedProducts() {
  const registered = await fetchRegisteredProducts();
  return mergeProducts(
    registered.filter((product) => product.isPreOwned),
    [...preOwnedVerified, ...priceDrops]
  );
}

export async function getRankedProducts(limit = 24): Promise<RankedProduct[]> {
  const products = await getCatalogProducts();
  return products.slice(0, limit).map((product, index) => ({
    ...product,
    rank: index + 1,
    trend: index < 3 ? "new" : index % 3 === 0 ? 1 : 0,
  }));
}
