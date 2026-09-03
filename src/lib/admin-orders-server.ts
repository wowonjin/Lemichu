import "server-only";

import { createdAtMs, toIso, toPlain } from "@/lib/admin-serialize";
import { getAdminDb } from "@/lib/firebase-admin";
import type { PurchaseOrder } from "@/lib/orders";

const EMPTY_AMOUNTS = {
  retailTotal: 0,
  productTotal: 0,
  instantDiscount: 0,
  couponDiscount: 0,
  shippingFee: 0,
  pointsUsed: 0,
  finalTotal: 0,
};

export function isSeedOrder(id: string, data: Record<string, unknown>) {
  const orderNo = typeof data.orderNo === "string" ? data.orderNo : "";
  return (
    Boolean(data.seedLabel) ||
    orderNo.startsWith("LM-TEMP") ||
    id.startsWith("LM-TEMP")
  );
}

function amountsFromTotal(total: number) {
  const safe = Number.isFinite(total) && total > 0 ? Math.round(total) : 0;
  return {
    ...EMPTY_AMOUNTS,
    retailTotal: safe,
    productTotal: safe,
    finalTotal: safe,
  };
}

function isDummyOrder(id: string, data: Record<string, unknown>) {
  return isSeedOrder(id, data) || data.source === "logii" || id.startsWith("logii-");
}

function normalizeOrder(
  id: string,
  data: Record<string, unknown>
): (PurchaseOrder & { _createdAtMs: number }) | null {
  if (isDummyOrder(id, data)) return null;

  const plain = toPlain(data) as Record<string, unknown>;
  const items = Array.isArray(plain.items) ? plain.items : [];
  const amounts =
    plain.amounts && typeof plain.amounts === "object"
      ? { ...EMPTY_AMOUNTS, ...(plain.amounts as Record<string, number>) }
      : amountsFromTotal(Number(plain.expectedAmount) || Number((plain.payment as { amount?: number } | undefined)?.amount) || 0);

  return {
    ...(plain as Omit<PurchaseOrder, "id">),
    id,
    userId: typeof plain.userId === "string" ? plain.userId : "",
    userEmail: typeof plain.userEmail === "string" ? plain.userEmail : "",
    userName: typeof plain.userName === "string" ? plain.userName : "",
    status: (plain.status as PurchaseOrder["status"]) || "pending",
    itemCount: Number(plain.itemCount) || items.length,
    items: items as PurchaseOrder["items"],
    amounts: {
      retailTotal: Number(amounts.retailTotal) || 0,
      productTotal: Number(amounts.productTotal) || 0,
      instantDiscount: Number(amounts.instantDiscount) || 0,
      couponDiscount: Number(amounts.couponDiscount) || 0,
      shippingFee: Number(amounts.shippingFee) || 0,
      pointsUsed: Number(amounts.pointsUsed) || 0,
      finalTotal: Number(amounts.finalTotal) || 0,
    },
    source: (plain.source as PurchaseOrder["source"]) || "web-cart",
    createdAt: toIso(data.createdAt) ?? undefined,
    updatedAt: toIso(data.updatedAt) ?? undefined,
    _createdAtMs: createdAtMs(data.createdAt),
  };
}

export async function listAdminOrders(): Promise<PurchaseOrder[]> {
  const snapshot = await getAdminDb().collection("orders").get();

  return snapshot.docs
    .map((doc) => normalizeOrder(doc.id, doc.data() as Record<string, unknown>))
    .filter((order): order is PurchaseOrder & { _createdAtMs: number } => Boolean(order))
    .sort((left, right) => right._createdAtMs - left._createdAtMs)
    .map(({ _createdAtMs, ...order }) => order);
}
