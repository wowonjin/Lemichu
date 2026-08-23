"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { Button } from "@/components/ui/button";
import { fetchAdminOrders, updateAdminOrderStatus } from "@/lib/admin";
import { downloadDeliveryExcel } from "@/lib/deliveryExport";
import {
  formatOrderDate,
  type OrderStatus,
  type PurchaseOrder,
} from "@/lib/orders";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { cn } from "@/lib/cn";

const statusOptions: Array<{ value: "all" | OrderStatus; label: string }> = [
  { value: "all", label: "전체" },
  { value: "pending", label: "결제대기" },
  { value: "paid", label: "결제완료" },
  { value: "failed", label: "결제실패" },
  { value: "preparing", label: "상품준비" },
  { value: "shipping", label: "배송중" },
  { value: "delivered", label: "배송완료" },
  { value: "cancelled", label: "취소" },
];

const statusLabels: Record<OrderStatus, string> = {
  pending: "결제대기",
  paid: "결제완료",
  failed: "결제실패",
  preparing: "상품준비",
  shipping: "배송중",
  delivered: "배송완료",
  cancelled: "취소",
};

const statusTextClass: Record<OrderStatus, string> = {
  pending: "text-muted-foreground",
  paid: "text-emerald-600",
  failed: "text-rose-600",
  preparing: "text-amber-600",
  shipping: "text-sky-600",
  delivered: "text-foreground",
  cancelled: "text-rose-600",
};

const statusDotClass: Record<OrderStatus, string> = {
  pending: "bg-muted-foreground",
  paid: "bg-emerald-500",
  failed: "bg-rose-500",
  preparing: "bg-amber-500",
  shipping: "bg-sky-500",
  delivered: "bg-foreground",
  cancelled: "bg-rose-500",
};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const loadOrders = async () => {
    setIsLoading(true);
    setError("");

    try {
      setOrders(await fetchAdminOrders());
    } catch (adminError) {
      setError(
        adminError instanceof Error
          ? adminError.message
          : "주문 목록을 불러오지 못했어요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return orders.filter((order) => {
      const firstItem = order.items[0];
      const matchStatus = status === "all" || order.status === status;
      const matchKeyword =
        !keyword ||
        [
          order.id,
          order.orderNo,
          order.userEmail,
          order.userName,
          firstItem?.brand,
          firstItem?.name,
        ].some((value) => value?.toLowerCase().includes(keyword));

      return matchStatus && matchKeyword;
    });
  }, [orders, query, status]);

  const deliveryExportOrders = useMemo(
    () =>
      filteredOrders.filter(
        (order) => !["pending", "failed", "cancelled"].includes(order.status)
      ),
    [filteredOrders]
  );

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    setError("");

    try {
      await updateAdminOrderStatus(orderId, nextStatus);
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order
        )
      );
    } catch (adminError) {
      setError(
        adminError instanceof Error
          ? adminError.message
          : "주문 상태를 변경하지 못했어요."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const handleDeliveryExport = () => {
    if (deliveryExportOrders.length === 0) {
      setError("택배 엑셀로 내보낼 주문이 없습니다. 결제완료 이후 주문만 내보낼 수 있어요.");
      return;
    }

    setError("");
    downloadDeliveryExcel(deliveryExportOrders);
  };

  return (
    <AdminShell>
      <AdminPageHeader
        title="주문 관리"
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading || deliveryExportOrders.length === 0}
            onClick={handleDeliveryExport}
            className="rounded-md"
          >
            <Download className="size-4" />
            택배 엑셀 다운로드
          </Button>
        }
      />

      {error ? <AdminNotice message={error} /> : null}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex h-11 items-center gap-2 rounded-md border border-border bg-secondary px-4 xl:min-w-96">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="주문번호, 고객, 상품 검색"
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={cn(
                "shrink-0 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors",
                status === option.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-3 pr-4 font-semibold first:pl-0">주문</th>
              <th className="px-4 py-3 font-semibold">고객</th>
              <th className="px-4 py-3 font-semibold">상품</th>
              <th className="px-4 py-3 font-semibold">금액</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold last:pr-0">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredOrders.map((order) => {
              const firstItem = order.items[0];
              const extraCount = Math.max(order.items.length - 1, 0);
              const canManageFulfillment = !["pending", "failed"].includes(order.status);

              return (
                <tr key={order.id} className="transition-colors hover:bg-secondary/50">
                  <td className="py-4 pr-4 first:pl-0">
                    <p className="font-semibold text-foreground">{order.orderNo ?? order.id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatOrderDate(order)}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-foreground">{order.userName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{order.userEmail}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-foreground">
                      {firstItem ? `${firstItem.brand} ${firstItem.name}` : "주문 상품"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      수량 {order.itemCount}개
                      {extraCount > 0 ? ` · 외 ${extraCount}개 상품` : ""}
                    </p>
                    {firstItem?.option ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        옵션 {firstItem.option}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 font-semibold tabular-nums text-foreground">
                    {formatPriceWithUnit(order.amounts.finalTotal)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-semibold",
                        statusTextClass[order.status] ?? "text-muted-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          statusDotClass[order.status] ?? "bg-muted-foreground"
                        )}
                      />
                      {statusLabels[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 last:pr-0">
                    <select
                      value={order.status}
                      disabled={updatingId === order.id || !canManageFulfillment}
                      onChange={(event) =>
                        handleStatusChange(order.id, event.target.value as OrderStatus)
                      }
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none disabled:opacity-50"
                    >
                      {statusOptions
                        .filter((option) => option.value !== "all")
                        .map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={
                              ["pending", "paid", "failed"].includes(option.value) &&
                              option.value !== order.status
                            }
                          >
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!isLoading && filteredOrders.length === 0 ? (
          <EmptyAdminState text="조건에 맞는 주문이 없습니다." />
        ) : null}

        {isLoading ? <EmptyAdminState text="주문 목록을 불러오는 중입니다." /> : null}
      </div>
    </AdminShell>
  );
}
