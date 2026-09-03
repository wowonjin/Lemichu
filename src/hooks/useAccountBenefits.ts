"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAccountBenefits,
  fetchAccountCouponCount,
  fetchPointLedger,
  type AccountBenefits,
} from "@/lib/accountBenefits";
import { fetchPurchaseOrders } from "@/lib/orders";
import { POINTS_CHANGED_EVENT, type PointLedgerEntry } from "@/lib/points";
import { useAuthUser } from "./useAuthUser";

function mergePointHistory(
  ledger: PointLedgerEntry[],
  orders: Awaited<ReturnType<typeof fetchPurchaseOrders>>
): PointLedgerEntry[] {
  const entries = new Map<string, PointLedgerEntry>();

  for (const entry of ledger) {
    entries.set(entry.id, entry);
  }

  for (const order of orders) {
    if (order.reward?.granted && !order.reward.reversed && (order.reward.points ?? 0) > 0) {
      if (!entries.has(order.id)) {
        entries.set(order.id, {
          id: order.id,
          type: "earn",
          amount: order.reward.points ?? 0,
          reason: "계좌이체 구매 적립",
          orderId: order.orderNo ?? order.id,
          purchaseAmount: order.amounts.finalTotal,
          rate: order.reward.rate,
          createdAt:
            typeof order.createdAt === "string" ? undefined : order.createdAt,
        });
      }
    }

    const used = order.amounts.pointsUsed ?? 0;
    const spendId = `spend_${order.id}`;
    if (used > 0 && !entries.has(spendId)) {
      entries.set(spendId, {
        id: spendId,
        type: "spend",
        amount: used,
        reason: "주문 결제 사용",
        orderId: order.orderNo ?? order.id,
        createdAt:
          typeof order.createdAt === "string" ? undefined : order.createdAt,
      });
    }
  }

  return [...entries.values()].sort((a, b) => {
    const aTime = a.createdAt?.toMillis() ?? 0;
    const bTime = b.createdAt?.toMillis() ?? 0;
    return bTime - aTime;
  });
}

export function useAccountBenefits() {
  const { user, ready } = useAuthUser();
  const [benefits, setBenefits] = useState<AccountBenefits>({
    points: 0,
    couponCount: 0,
  });
  const [ledger, setLedger] = useState<PointLedgerEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (!ready) return;
    if (!user?.uid) {
      setBenefits({ points: 0, couponCount: 0 });
      setLedger([]);
      setStatus("ready");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const [nextBenefits, nextLedger, orders, couponCount] = await Promise.all([
        fetchAccountBenefits(user.uid),
        fetchPointLedger(user.uid),
        fetchPurchaseOrders(user.uid, 50).catch(() => []),
        fetchAccountCouponCount(user.uid).catch(() => 0),
      ]);
      setBenefits({ ...nextBenefits, couponCount });
      setLedger(mergePointHistory(nextLedger, orders));
      setStatus("ready");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "혜택 정보를 불러오지 못했어요."
      );
      setStatus("error");
    }
  }, [ready, reloadKey, user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const refresh = () => setReloadKey((value) => value + 1);
    window.addEventListener(POINTS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(POINTS_CHANGED_EVENT, refresh);
  }, []);

  return {
    benefits,
    ledger,
    status,
    error,
    retry: () => setReloadKey((value) => value + 1),
    user,
    ready,
  };
}
