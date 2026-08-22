"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPurchaseOrders, type PurchaseOrder } from "@/lib/orders";
import { useAuthUser } from "./useAuthUser";

export function usePurchaseOrders() {
  const { user, ready } = useAuthUser();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (!ready) return;
    if (!user?.uid) {
      setOrders([]);
      setStatus("ready");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const next = await fetchPurchaseOrders(user.uid, 50);
      setOrders(next);
      setStatus("ready");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "주문 내역을 불러오지 못했어요.");
      setStatus("error");
    }
  }, [ready, reloadKey, user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    orders,
    status,
    error,
    retry: () => setReloadKey((value) => value + 1),
    user,
    ready,
  };
}
