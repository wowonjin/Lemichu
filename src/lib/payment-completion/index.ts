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
import { revalidateProductCatalog } from "@/lib/catalog-revalidate";
import {
  computeInventoryUpdates,
  writeInventoryUpdates,
} from "@/lib/payment-completion/inventory-tx";

type CompletionOrder = {
  userId?: string;
  isGuest?: boolean;
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
  inventory?: {
    processed?: boolean;
    restored?: boolean;
    paymentReference?: string;
  };
};

export type CompletePaymentInput = {
  orderId: string;
  paymentReference: string;
  paymentMethod: string;
  paidAt?: Date | Timestamp;
  paymentDetails?: Record<string, unknown>;
  nextStatus?: "paid" | "preparing";
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
  if (order.status !== "pending" || (!order.userId && order.isGuest !== true)) {
    throw new Error("ORDER_NOT_PAYABLE");
  }

  const orderItems = Array.isArray(order.items) ? order.items : [];
  if (orderItems.length === 0) throw new Error("ORDER_ITEMS_MISSING");

  const inventoryAlreadyProcessed = order.inventory?.processed === true;
  const memberUserId = order.isGuest === true ? "" : String(order.userId || "");
  const userRef = memberUserId
    ? db.collection("users").doc(memberUserId)
    : null;
  const earnLedgerRef = userRef
    ? userRef.collection("pointLedger").doc(input.orderId)
    : null;

  const [inventoryUpdates, earnLedgerSnapshot] = await Promise.all([
    inventoryAlreadyProcessed
      ? Promise.resolve([])
      : computeInventoryUpdates(db, tx, orderItems),
    earnLedgerRef ? tx.get(earnLedgerRef) : Promise.resolve(null),
  ]);

  const paymentMethodCode = toPaymentMethodCode(order, input.paymentMethod);
  const purchaseAmount = Number(order.expectedAmount ?? order.amounts?.finalTotal ?? 0);
  const points = userRef
    ? calculatePurchasePoints(purchaseAmount, input.paymentMethod)
    : 0;
  const shouldGrantReward =
    Boolean(userRef && earnLedgerRef) &&
    order.reward?.granted !== true &&
    order.reward?.reversed !== true &&
    earnLedgerSnapshot?.exists !== true;
  const paidAt = toPaidAt(input.paidAt);

  writeInventoryUpdates(tx, inventoryUpdates);

  if (userRef && earnLedgerRef && shouldGrantReward && points > 0) {
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
    status: input.nextStatus === "paid" ? "paid" : "preparing",
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
  const result = await db.runTransaction(async (tx) => {
    const orderSnapshot = await tx.get(orderRef);
    return applyPaymentCompletionInTransaction({
      db,
      tx,
      orderRef,
      orderSnapshot,
      input,
    });
  });
  if (result.status === "completed") {
    revalidateProductCatalog();
  }
  return result;
}

export async function reserveOrderInventory(
  orderId: string,
  db = getAdminDb()
): Promise<{ reserved: boolean }> {
  const orderRef = db.collection("orders").doc(orderId);
  const result = await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(orderRef);
    if (!snapshot.exists) return { reserved: false };
    const order = snapshot.data() as CompletionOrder;
    if (order.inventory?.processed === true) return { reserved: false };
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) return { reserved: false };

    const updates = await computeInventoryUpdates(db, tx, items);
    writeInventoryUpdates(tx, updates);
    tx.update(orderRef, {
      inventory: {
        ...(order.inventory ?? {}),
        processed: true,
        processedAt: FieldValue.serverTimestamp(),
        restored: false,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { reserved: true };
  });
  if (result.reserved) {
    revalidateProductCatalog();
  }
  return result;
}

export async function restoreOrderInventory(
  orderId: string,
  db = getAdminDb()
): Promise<{ restored: boolean }> {
  const orderRef = db.collection("orders").doc(orderId);
  const result = await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(orderRef);
    if (!snapshot.exists) return { restored: false };
    const order = snapshot.data() as CompletionOrder;
    if (order.inventory?.processed !== true || order.inventory?.restored === true) {
      return { restored: false };
    }
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) return { restored: false };

    const updates = await computeInventoryUpdates(db, tx, items, "revert");
    writeInventoryUpdates(tx, updates);
    tx.update(orderRef, {
      inventory: {
        ...(order.inventory ?? {}),
        processed: false,
        restored: true,
        restoredAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { restored: true };
  });
  if (result.restored) {
    revalidateProductCatalog();
  }
  return result;
}
