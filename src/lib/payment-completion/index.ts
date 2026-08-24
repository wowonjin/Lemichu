import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import type { OrderItemSnapshot } from "@/lib/checkout";
import { getAdminDb } from "@/lib/firebase-admin";
import type { PaymentMethod } from "@/lib/orders";
import {
  BANK_TRANSFER_POINT_RATE,
  calculatePurchasePoints,
} from "@/lib/points";
import { applyInventoryItems } from "@/lib/payment-completion/inventory";

type CompletionOrder = {
  userId?: string;
  status?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: string;
  paymentReference?: string;
  expectedAmount?: number;
  amounts?: { finalTotal?: number };
  items?: OrderItemSnapshot[];
  payment?: Record<string, unknown> & {
    provider?: string;
    paymentKey?: string;
    method?: string;
    requestedMethod?: string;
  };
  reward?: {
    points?: number;
    rate?: number;
    granted?: boolean;
    reversed?: boolean;
    method?: string;
  };
  inventory?: { processed?: boolean; paymentReference?: string };
};

export type CompletePaymentInput = {
  orderId: string;
  paymentReference: string;
  paymentMethod: string;
  paidAt?: Date | Timestamp;
  paymentDetails?: Record<string, unknown>;
};

export type PaymentCompletionResult = {
  status: "completed" | "already_processed";
  orderId: string;
};

function toPaidAt(value?: Date | Timestamp) {
  if (value instanceof Timestamp) return value;
  return Timestamp.fromDate(value ?? new Date());
}

function toPaymentMethodCode(order: CompletionOrder, method: string): PaymentMethod {
  if (order.paymentMethod) return order.paymentMethod;
  if (order.payment?.provider === "bank-transfer") return "BANK_TRANSFER";
  if (order.payment?.provider === "points") return "POINTS";
  return method.toUpperCase().includes("TRANSFER") ? "TOSS_TRANSFER" : "TOSS_CARD";
}

function isAlreadyPaid(order: CompletionOrder) {
  return (
    order.paymentStatus === "PAID" ||
    ["paid", "preparing", "shipping", "delivered"].includes(String(order.status))
  );
}

export async function applyPaymentCompletionInTransaction({
  db,
  tx,
  orderRef,
  orderSnapshot,
  input,
}: {
  db: Firestore;
  tx: Transaction;
  orderRef: DocumentReference;
  orderSnapshot: DocumentSnapshot;
  input: CompletePaymentInput;
}): Promise<PaymentCompletionResult> {
  if (!orderSnapshot.exists) throw new Error("ORDER_NOT_FOUND");
  const order = orderSnapshot.data() as CompletionOrder;
  const existingReference =
    order.paymentReference || String(order.payment?.paymentKey || "");

  if (isAlreadyPaid(order)) {
    if (!existingReference || existingReference === input.paymentReference) {
      return { status: "already_processed", orderId: input.orderId };
    }
    throw new Error("ORDER_ALREADY_PAID");
  }
  if (order.status !== "pending" || !order.userId) {
    throw new Error("ORDER_NOT_PAYABLE");
  }

  const orderItems = Array.isArray(order.items) ? order.items : [];
  if (orderItems.length === 0) throw new Error("ORDER_ITEMS_MISSING");

  const itemsByProduct = new Map<string, OrderItemSnapshot[]>();
  for (const item of orderItems) {
    const current = itemsByProduct.get(item.productId) ?? [];
    current.push(item);
    itemsByProduct.set(item.productId, current);
  }

  const inventoryAlreadyProcessed = order.inventory?.processed === true;
  const productEntries = inventoryAlreadyProcessed
    ? []
    : [...itemsByProduct.entries()].map(([productId, items]) => ({
        productId,
        items,
        ref: db.collection("products").doc(productId),
      }));
  const userRef = db.collection("users").doc(order.userId);
  const earnLedgerRef = userRef.collection("pointLedger").doc(input.orderId);

  const [productSnapshots, earnLedgerSnapshot] = await Promise.all([
    Promise.all(productEntries.map((entry) => tx.get(entry.ref))),
    tx.get(earnLedgerRef),
  ]);

  const inventoryUpdates = productEntries.map((entry, index) => {
    const snapshot = productSnapshots[index];
    if (!snapshot?.exists) throw new Error("INVENTORY_PRODUCT_NOT_FOUND");
    return {
      ref: entry.ref,
      update: applyInventoryItems(snapshot.data() ?? {}, entry.items),
    };
  });

  const paymentMethodCode = toPaymentMethodCode(order, input.paymentMethod);
  const purchaseAmount = Number(order.expectedAmount ?? order.amounts?.finalTotal ?? 0);
  const points = calculatePurchasePoints(purchaseAmount, input.paymentMethod);
  const shouldGrantReward =
    order.reward?.granted !== true &&
    order.reward?.reversed !== true &&
    !earnLedgerSnapshot.exists;
  const paidAt = toPaidAt(input.paidAt);

  for (const { ref, update } of inventoryUpdates) {
    tx.update(ref, {
      ...update,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  if (shouldGrantReward && points > 0) {
    tx.set(
      userRef,
      {
        points: FieldValue.increment(points),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.create(earnLedgerRef, {
      type: "earn",
      amount: points,
      reason: "계좌이체 구매 적립",
      orderId: input.orderId,
      purchaseAmount,
      rate: BANK_TRANSFER_POINT_RATE,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  tx.update(orderRef, {
    status: "preparing",
    paymentStatus: "PAID",
    paymentMethod: paymentMethodCode,
    paidAt,
    paymentReference: input.paymentReference,
    payment: {
      ...(order.payment ?? {}),
      ...(input.paymentDetails ?? {}),
      method: input.paymentMethod,
      approvedAt: paidAt,
    },
    reward: {
      points,
      rate: points > 0 ? BANK_TRANSFER_POINT_RATE : 0,
      granted: order.reward?.granted === true || shouldGrantReward,
      reversed: false,
      method: input.paymentMethod,
    },
    inventory: {
      processed: true,
      processedAt: FieldValue.serverTimestamp(),
      paymentReference: input.paymentReference,
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { status: "completed", orderId: input.orderId };
}

export async function completePayment(
  input: CompletePaymentInput,
  db = getAdminDb()
): Promise<PaymentCompletionResult> {
  const orderRef = db.collection("orders").doc(input.orderId);
  return db.runTransaction(async (tx) => {
    const orderSnapshot = await tx.get(orderRef);
    return applyPaymentCompletionInTransaction({
      db,
      tx,
      orderRef,
      orderSnapshot,
      input,
    });
  });
}
