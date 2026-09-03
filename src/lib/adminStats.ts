import { toDateValue } from "@/lib/admin-serialize";
import type { OrderStatus, PurchaseOrder } from "@/lib/orders";

export type DailySalesPoint = {
  date: Date;
  label: string;
  revenue: number;
  orders: number;
};

export type StatusSlice = {
  status: OrderStatus;
  label: string;
  count: number;
  ratio: number;
};

export type TrendResult = {
  /** 증감률(%) — 직전 동일 기간 대비. 직전 기간이 0이면 null */
  value: number | null;
  label: string;
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "결제대기",
  paid: "결제완료",
  failed: "결제실패",
  preparing: "상품준비",
  shipping: "배송중",
  delivered: "배송완료",
  cancelled: "취소",
};

const statusOrder: OrderStatus[] = [
  "pending",
  "paid",
  "failed",
  "preparing",
  "shipping",
  "delivered",
  "cancelled",
];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function orderDate(order: PurchaseOrder): Date | null {
  return toDateValue(order.createdAt);
}

/** 최근 `days`일의 일자별 매출/주문수 (오래된 → 최신 순) */
export function buildDailySales(orders: PurchaseOrder[], days = 14): DailySalesPoint[] {
  const today = startOfDay(new Date());
  const points: DailySalesPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    points.push({
      date,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      revenue: 0,
      orders: 0,
    });
  }

  const indexByTime = new Map(points.map((point, index) => [point.date.getTime(), index]));

  for (const order of orders) {
    if (!isRevenueOrder(order)) continue;
    const created = orderDate(order);
    if (!created) continue;
    const key = startOfDay(created).getTime();
    const index = indexByTime.get(key);
    if (index === undefined) continue;
    points[index].revenue += order.amounts.finalTotal;
    points[index].orders += 1;
  }

  return points;
}

/** 주문 상태별 건수/비율 (건수 내림차순, 0건 상태는 제외) */
export function buildStatusBreakdown(orders: PurchaseOrder[]): StatusSlice[] {
  const counts = new Map<OrderStatus, number>();
  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
  }

  const total = orders.length || 1;

  return statusOrder
    .map((status) => {
      const count = counts.get(status) ?? 0;
      return {
        status,
        label: statusLabels[status],
        count,
        ratio: count / total,
      };
    })
    .filter((slice) => slice.count > 0)
    .sort((a, b) => b.count - a.count);
}

function sumInWindow(
  orders: PurchaseOrder[],
  from: Date,
  to: Date,
  selector: (order: PurchaseOrder) => number
) {
  return orders.reduce((sum, order) => {
    const created = orderDate(order);
    if (!created) return sum;
    if (created >= from && created < to) {
      return sum + selector(order);
    }
    return sum;
  }, 0);
}

function isRevenueOrder(order: PurchaseOrder) {
  const itemName = `${order.items?.[0]?.brand ?? ""} ${order.items?.[0]?.name ?? ""}`;
  if (itemName.includes("검수")) return false;
  return ["paid", "preparing", "shipping", "delivered"].includes(order.status);
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** 최근 `windowDays`일 vs 직전 동일 기간의 매출·주문 증감률 */
export function buildTrend(orders: PurchaseOrder[], windowDays = 7) {
  const now = new Date();
  const recentFrom = new Date(now);
  recentFrom.setDate(now.getDate() - windowDays);
  const previousFrom = new Date(now);
  previousFrom.setDate(now.getDate() - windowDays * 2);

  const recentRevenue = sumInWindow(orders, recentFrom, now, (o) =>
    isRevenueOrder(o) ? o.amounts.finalTotal : 0
  );
  const previousRevenue = sumInWindow(orders, previousFrom, recentFrom, (o) =>
    isRevenueOrder(o) ? o.amounts.finalTotal : 0
  );
  const recentOrders = sumInWindow(orders, recentFrom, now, () => 1);
  const previousOrders = sumInWindow(orders, previousFrom, recentFrom, () => 1);

  const periodLabel = `최근 ${windowDays}일 기준`;

  const revenue: TrendResult = {
    value: percentChange(recentRevenue, previousRevenue),
    label: periodLabel,
  };
  const ordersTrend: TrendResult = {
    value: percentChange(recentOrders, previousOrders),
    label: periodLabel,
  };

  return { revenue, orders: ordersTrend };
}
