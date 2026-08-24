import "server-only";

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  BANK_TRANSFER_POINT_RATE,
  calculatePurchasePoints,
  getUsablePoints,
  toSafePoints,
} from "@/lib/points";

type OrderPointData = {
  userId?: string;
  amounts?: { finalTotal?: number; pointsUsed?: number };
  payment?: { method?: string; requestedMethod?: string };
  reward?: { granted?: boolean; reversed?: boolean; points?: number };
  points?: { spent?: boolean; restored?: boolean };
};

function spendLedgerId(orderId: string) {
  return `spend_${orderId}`;
}

function restoreLedgerId(orderId: string) {
  return `restore_${orderId}`;
}

function reverseEarnLedgerId(orderId: string) {
  return `reverse_${orderId}`;
}

export async function grantPurchasePoints({
  userId,
  orderId,
  purchaseAmount,
  paymentMethod,
}: {
  userId: string;
  orderId: string;
  purchaseAmount: number;
  paymentMethod: string;
}) {
  const points = calculatePurchasePoints(purchaseAmount, paymentMethod);
  const db = getAdminDb();
  const orderRef = db.collection("orders").doc(orderId);
  const userRef = db.collection("users").doc(userId);
  const ledgerRef = userRef.collection("pointLedger").doc(orderId);

  await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    const order = orderSnap.data() as OrderPointData | undefined;
    if (order?.reward?.granted || order?.reward?.reversed) return;

    tx.update(orderRef, {
      reward: {
        points,
        rate: points > 0 ? BANK_TRANSFER_POINT_RATE : 0,
        granted: true,
        reversed: false,
        method: paymentMethod,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (points <= 0) return;

    tx.set(
      userRef,
      {
        points: FieldValue.increment(points),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(ledgerRef, {
      type: "earn",
      amount: points,
      reason: "계좌이체 구매 적립",
      orderId,
      purchaseAmount,
      rate: BANK_TRANSFER_POINT_RATE,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return points;
}

export async function applyOrderPointSpend({
  db = getAdminDb(),
  userId,
  orderId,
  requestedPoints,
  payableBeforePoints,
}: {
  db?: Firestore;
  userId: string;
  orderId: string;
  requestedPoints: number;
  payableBeforePoints: number;
}) {
  const userRef = db.collection("users").doc(userId);
  const orderRef = db.collection("orders").doc(orderId);
  const ledgerRef = userRef.collection("pointLedger").doc(spendLedgerId(orderId));

  return db.runTransaction(async (tx) => {
    const [userSnap, orderSnap, ledgerSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(orderRef),
      tx.get(ledgerRef),
    ]);

    if (ledgerSnap.exists) {
      return toSafePoints(ledgerSnap.data()?.amount);
    }

    const available = toSafePoints(userSnap.data()?.points);
    const pointsUsed = getUsablePoints(payableBeforePoints, Math.min(available, requestedPoints));
    const order = orderSnap.data() as OrderPointData | undefined;

    if (orderSnap.exists) {
      tx.update(orderRef, {
        "amounts.pointsUsed": pointsUsed,
        "points.spent": pointsUsed > 0,
        "points.restored": false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    if (pointsUsed <= 0) return 0;

    tx.set(
      userRef,
      {
        points: FieldValue.increment(-pointsUsed),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(ledgerRef, {
      type: "spend",
      amount: pointsUsed,
      reason: "주문 결제 사용",
      orderId,
      createdAt: FieldValue.serverTimestamp(),
    });

    return pointsUsed;
  });
}

export async function restoreOrderPoints(orderId: string) {
  const db = getAdminDb();
  const orderRef = db.collection("orders").doc(orderId);

  await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    const order = orderSnap.data() as OrderPointData | undefined;
    const userId = order?.userId;
    if (!orderSnap.exists || !userId) return;

    const userRef = db.collection("users").doc(userId);
    const spendRef = userRef.collection("pointLedger").doc(spendLedgerId(orderId));
    const restoreRef = userRef.collection("pointLedger").doc(restoreLedgerId(orderId));
    const reverseRef = userRef.collection("pointLedger").doc(reverseEarnLedgerId(orderId));
    const [spendSnap, restoreSnap, reverseSnap] = await Promise.all([
      tx.get(spendRef),
      tx.get(restoreRef),
      tx.get(reverseRef),
    ]);

    const spentAmount = toSafePoints(
      spendSnap.data()?.amount ?? order.amounts?.pointsUsed ?? 0
    );
    const earnedAmount = order.reward?.granted ? toSafePoints(order.reward.points) : 0;

    if (spentAmount > 0 && !restoreSnap.exists && !order.points?.restored) {
      tx.set(
        userRef,
        {
          points: FieldValue.increment(spentAmount),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      tx.set(restoreRef, {
        type: "earn",
        amount: spentAmount,
        reason: "주문 취소 적립금 반환",
        orderId,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    if (earnedAmount > 0 && !reverseSnap.exists && !order.reward?.reversed) {
      tx.set(
        userRef,
        {
          points: FieldValue.increment(-earnedAmount),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      tx.set(reverseRef, {
        type: "spend",
        amount: earnedAmount,
        reason: "주문 취소 적립 회수",
        orderId,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    tx.update(orderRef, {
      "points.restored": true,
      "reward.reversed": Boolean(order.reward?.granted),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function syncOrderPointsOnStatusChange({
  orderId,
  previousStatus,
  nextStatus,
  paymentMethod,
}: {
  orderId: string;
  previousStatus: string;
  nextStatus: string;
  paymentMethod?: string;
}) {
  const db = getAdminDb();
  const orderSnap = await db.collection("orders").doc(orderId).get();
  const order = orderSnap.data() as OrderPointData | undefined;
  if (!orderSnap.exists || !order?.userId) return;

  const becamePaid = nextStatus === "paid" && previousStatus !== "paid";
  const becameCancelled =
    (nextStatus === "cancelled" || nextStatus === "failed") &&
    previousStatus !== "cancelled" &&
    previousStatus !== "failed";

  if (becamePaid) {
    await grantPurchasePoints({
      userId: order.userId,
      orderId,
      purchaseAmount: Number(order.amounts?.finalTotal ?? 0),
      paymentMethod:
        paymentMethod ||
        order.payment?.method ||
        order.payment?.requestedMethod ||
        "",
    });
  }

  if (becameCancelled) {
    await restoreOrderPoints(orderId);
  }
}
