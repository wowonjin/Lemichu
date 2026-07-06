import type { Product } from "@/types/product";

export type CheckoutItemInput = {
  productId: string;
  quantity?: number;
  option?: string;
  expectedArrival?: string;
  store?: string;
};

export type ResolvedCheckoutItem = {
  product: Product;
  quantity: number;
  option: string;
  expectedArrival: string;
  store: string;
};

export type CheckoutAmounts = {
  retailTotal: number;
  productTotal: number;
  instantDiscount: number;
  couponDiscount: number;
  shippingFee: number;
  finalTotal: number;
};

export type OrderItemSnapshot = {
  productId: string;
  brand: string;
  name: string;
  imageUrl: string;
  href: string;
  option: string;
  store: string;
  expectedArrival: string;
  quantity: number;
  priceAtPurchase: number;
  retailPriceAtPurchase?: number;
  deliveryBadge: Product["deliveryBadge"];
  authenticationStatus: Product["authenticationStatus"];
};

const DEFAULT_COUPON_DISCOUNT = 120_000;
const DEFAULT_STORE = "LEMICHU 검수센터";

function getDefaultExpectedArrival(product: Product): string {
  if (product.deliveryBadge === "오늘출고") return "오늘 출고 가능";
  if (product.deliveryBadge === "국내배송") return "평균 2-4일 내 도착";
  if (product.deliveryBadge === "예약배송") return "입고 일정 확인 후 순차 배송";
  return "평균 8-15일 내 도착";
}

export function normalizeQuantity(quantity: unknown): number {
  const nextQuantity = Number(quantity ?? 1);
  if (!Number.isFinite(nextQuantity)) return 1;

  return Math.min(Math.max(Math.floor(nextQuantity), 1), 99);
}

export function createProductCheckoutItem(product: Product): CheckoutItemInput {
  return {
    productId: product.id,
    quantity: 1,
    option: [product.color, product.size].filter(Boolean).join(" / ") || "단일 옵션",
    store: DEFAULT_STORE,
  };
}

export function resolveCheckoutItems(
  items: CheckoutItemInput[],
  products: Product[]
): ResolvedCheckoutItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("EMPTY_CHECKOUT_ITEMS");
  }

  return items.map((item) => {
    const productId = typeof item.productId === "string" ? item.productId.trim() : "";
    const product = productId
      ? products.find((product) => product.id === productId)
      : undefined;

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    return {
      product,
      quantity: normalizeQuantity(item.quantity),
      option: item.option?.trim() || product.size || product.color || "단일 옵션",
      expectedArrival: item.expectedArrival?.trim() || getDefaultExpectedArrival(product),
      store: item.store?.trim() || DEFAULT_STORE,
    };
  });
}

export function calculateCheckoutAmounts(items: ResolvedCheckoutItem[]): CheckoutAmounts {
  const productTotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const retailTotal = items.reduce(
    (total, item) =>
      total + (item.product.retailPrice ?? item.product.price) * item.quantity,
    0
  );
  const instantDiscount = Math.max(retailTotal - productTotal, 0);
  const couponDiscount = items.length > 0 ? DEFAULT_COUPON_DISCOUNT : 0;
  const shippingFee = productTotal >= 500_000 || productTotal === 0 ? 0 : 3_000;

  return {
    retailTotal,
    productTotal,
    instantDiscount,
    couponDiscount,
    shippingFee,
    finalTotal: productTotal - couponDiscount + shippingFee,
  };
}

export function toOrderItemSnapshot(item: ResolvedCheckoutItem): OrderItemSnapshot {
  const snapshot: OrderItemSnapshot = {
    productId: item.product.id,
    brand: item.product.brand,
    name: item.product.name,
    imageUrl: item.product.imageUrl,
    href: item.product.href,
    option: item.option,
    store: item.store,
    expectedArrival: item.expectedArrival,
    quantity: item.quantity,
    priceAtPurchase: item.product.price,
    deliveryBadge: item.product.deliveryBadge,
    authenticationStatus: item.product.authenticationStatus,
  };

  if (item.product.retailPrice !== undefined) {
    snapshot.retailPriceAtPurchase = item.product.retailPrice;
  }

  return snapshot;
}

export function buildTossOrderName(items: ResolvedCheckoutItem[]): string {
  const firstItem = items[0];
  if (!firstItem) return "LEMICHU 주문";

  const firstName = `${firstItem.product.brand} ${firstItem.product.name}`;
  const orderName =
    items.length === 1 ? firstName : `${firstName} 외 ${items.length - 1}건`;

  return orderName.length > 100 ? `${orderName.slice(0, 97)}...` : orderName;
}
