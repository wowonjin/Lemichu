import { ORDER_STATUS_LABELS } from "@/lib/orderStatus";
import type { OrderStatus } from "@/lib/orders";

export type GuestOrderLookupItem = {
  orderId: string;
  orderNo: string;
  productName: string;
  status: OrderStatus;
  statusLabel: string;
  courier: string;
  invoiceNo: string;
};

export async function lookupGuestOrders(query: string) {
  const response = await fetch("/api/orders/guest/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    message?: string;
    orders?: GuestOrderLookupItem[];
  };

  if (!response.ok || json.ok === false) {
    throw new Error(json.message || "주문을 조회하지 못했어요.");
  }

  return Array.isArray(json.orders) ? json.orders : [];
}

export function guestOrderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}
