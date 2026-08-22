import type { OrderStatus, PurchaseOrder } from "@/lib/orders";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "결제대기",
  paid: "결제완료",
  failed: "결제실패",
  preparing: "상품준비",
  shipping: "배송중",
  delivered: "배송완료",
  cancelled: "취소",
};

/** 백엔드에 존재하는 진행 단계만 사용. 검수진행 등 없는 상태는 저장하지 않습니다. */
export const ORDER_PROGRESS_STEPS: OrderStatus[] = [
  "paid",
  "preparing",
  "shipping",
  "delivered",
];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "preparing",
  "shipping",
];

export type OrderSummaryKey = "paid" | "preparing" | "shipping" | "delivered";

export const ORDER_SUMMARY_ITEMS: Array<{
  key: OrderSummaryKey;
  label: string;
  href: string;
}> = [
  { key: "paid", label: "결제완료", href: "/my/orders?status=paid" },
  { key: "preparing", label: "상품준비", href: "/my/orders?status=preparing" },
  { key: "shipping", label: "배송중", href: "/my/orders?status=shipping" },
  { key: "delivered", label: "구매확정", href: "/my/orders?status=delivered" },
];

export function isOrderStatus(value: string | null | undefined): value is OrderStatus {
  return Boolean(value && value in ORDER_STATUS_LABELS);
}

export function getActiveOrders(orders: PurchaseOrder[]) {
  return orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status));
}

export function countOrdersByStatus(orders: PurchaseOrder[]) {
  return orders.reduce(
    (counts, order) => {
      counts[order.status] += 1;
      return counts;
    },
    {
      pending: 0,
      paid: 0,
      failed: 0,
      preparing: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    } satisfies Record<OrderStatus, number>
  );
}

export function getOrderProgressIndex(status: OrderStatus) {
  return ORDER_PROGRESS_STEPS.indexOf(status);
}

export function getCancelledOrders(orders: PurchaseOrder[]) {
  return orders.filter((order) => order.status === "cancelled" || order.status === "failed");
}
