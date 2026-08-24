"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { observeAuthUser, type AuthUser } from "@/lib/auth";
import {
  fetchPurchaseOrders,
  formatOrderDate,
  type OrderStatus,
  type PurchaseOrder,
} from "@/lib/orders";
import { formatPriceWithUnit } from "@/lib/formatPrice";

const statusLabels: Record<OrderStatus, string> = {
  pending: "결제대기",
  paid: "결제완료",
  failed: "결제실패",
  preparing: "상품준비",
  shipping: "배송중",
  delivered: "배송완료",
  cancelled: "취소",
};
import { getLoginHref } from "@/lib/redirect";

type FallbackOrder = {
  id: string;
  date: string;
  brand: string;
  name: string;
  status: string;
  price: string;
};

export function OrderHistory({ fallbackOrders }: { fallbackOrders: FallbackOrder[] }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => observeAuthUser(setAuthUser), []);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      if (!authUser?.uid) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const nextOrders = await fetchPurchaseOrders(authUser.uid);
        if (!cancelled) {
          setOrders(nextOrders);
        }
      } catch (orderError) {
        if (!cancelled) {
          setError(
            orderError instanceof Error
              ? orderError.message
              : "주문 내역을 불러오지 못했어요."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [authUser?.uid]);

  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          주문 기록은 로그인 후 확인할 수 있어요.
        </p>
        <Link
          href={getLoginHref("/my/orders")}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-sand p-8 text-center text-sm font-medium text-muted-foreground">
        주문 내역을 불러오는 중입니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-gold-soft p-8 text-center text-sm font-medium text-foreground">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <div className="rounded-2xl bg-sand p-8 text-center">
          <p className="text-sm font-semibold text-foreground">
            아직 저장된 주문 기록이 없어요.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            구매하기를 누르고 결제를 완료하면 주문 기록이 저장됩니다.
          </p>
        </div>
        <div className="mt-5 divide-y divide-border">
          {fallbackOrders.map((order) => (
            <FallbackOrderRow key={order.id} order={order} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {orders.map((order) => (
        <FirestoreOrderRow key={order.id} order={order} />
      ))}
    </div>
  );
}

function FirestoreOrderRow({ order }: { order: PurchaseOrder }) {
  const firstItem = order.items[0];
  const extraCount = Math.max(order.items.length - 1, 0);

  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-gold-soft px-2.5 py-0.5 text-xs font-semibold text-foreground">
            {statusLabels[order.status] ?? order.status}
          </span>
          <time className="text-xs text-muted-foreground">{formatOrderDate(order)}</time>
        </div>
        <p className="mt-2 text-sm font-semibold text-foreground">
          {firstItem?.brand ?? "LEMICHU"}
        </p>
        <p className="text-xs text-muted-foreground">
          {firstItem
            ? `${firstItem.name}${extraCount > 0 ? ` 외 ${extraCount}개` : ""}`
            : "주문 상품"}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          주문번호 {order.orderNo ?? order.id}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatPriceWithUnit(order.amounts.finalTotal)}
        </span>
        <Link
          href="/my/delivery"
          className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          배송조회
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function FallbackOrderRow({ order }: { order: FallbackOrder }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
            {order.status}
          </span>
          <time className="text-xs text-muted-foreground">{order.date}</time>
        </div>
        <p className="mt-2 text-sm font-semibold text-foreground">{order.brand}</p>
        <p className="text-xs text-muted-foreground">{order.name}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">예시 주문번호 {order.id}</p>
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {order.price}
      </span>
    </div>
  );
}
