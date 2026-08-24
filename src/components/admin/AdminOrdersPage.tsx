"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, FileSpreadsheet, Search } from "lucide-react";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { Button } from "@/components/ui/button";
import { fetchAdminOrders, updateAdminOrderStatus } from "@/lib/admin";
import {
  importAdminLogiiWorkbook,
  updateAdminOrderDelivery,
} from "@/lib/member-account-client";
import { downloadDeliveryExcel } from "@/lib/deliveryExport";
import type {
  LogiiImportReport,
  LogiiImportRowStatus,
} from "@/lib/logii-delivery";
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
  const logiiFileInputRef = useRef<HTMLInputElement>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isImportingLogii, setIsImportingLogii] = useState(false);
  const [logiiReport, setLogiiReport] = useState<LogiiImportReport | null>(null);
  const [updatingId, setUpdatingId] = useState("");
  const [deliveryDrafts, setDeliveryDrafts] = useState<Record<string, { courier: string; invoiceNo: string }>>({});

  const loadOrders = async () => {
    setIsLoading(true);
    setError("");

    try {
      const nextOrders = await fetchAdminOrders();
      setOrders(nextOrders);
      setDeliveryDrafts(
        Object.fromEntries(
          nextOrders.map((order) => [
            order.id,
            {
              courier: order.delivery?.courier ?? "",
              invoiceNo: order.delivery?.invoiceNo ?? "",
            },
          ])
        )
      );
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
      const savedStatus = await updateAdminOrderStatus(orderId, nextStatus);
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status: savedStatus } : order
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

  const handleLogiiUpload = async (file?: File) => {
    if (!file) return;
    setIsImportingLogii(true);
    setError("");

    try {
      const report = await importAdminLogiiWorkbook(file);
      setLogiiReport(report);
      await loadOrders();
    } catch (adminError) {
      setError(
        adminError instanceof Error
          ? adminError.message
          : "로지아이 배송 엑셀을 처리하지 못했어요."
      );
    } finally {
      setIsImportingLogii(false);
      if (logiiFileInputRef.current) {
        logiiFileInputRef.current.value = "";
      }
    }
  };

  return (
    <AdminShell>
      <AdminPageHeader
        title="주문 관리"
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              ref={logiiFileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => handleLogiiUpload(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isImportingLogii}
              onClick={() => logiiFileInputRef.current?.click()}
              className="rounded-md"
            >
              <FileSpreadsheet className="size-4" />
              {isImportingLogii ? "주문 찾는 중..." : "로지아이 엑셀 연동"}
            </Button>
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
          </div>
        }
      />

      {error ? <AdminNotice message={error} /> : null}
      {logiiReport ? (
        <LogiiImportReportPanel
          report={logiiReport}
          onClose={() => setLogiiReport(null)}
        />
      ) : null}

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
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-3 pr-4 font-semibold first:pl-0">주문</th>
              <th className="px-4 py-3 font-semibold">고객</th>
              <th className="px-4 py-3 font-semibold">상품</th>
              <th className="px-4 py-3 font-semibold">금액</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold">배송</th>
              <th className="px-4 py-3 font-semibold last:pr-0">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredOrders.map((order) => {
              const firstItem = order.items[0];
              const extraCount = Math.max(order.items.length - 1, 0);
              const canManageFulfillment = !["failed", "cancelled"].includes(order.status);

              return (
                <tr key={order.id} className="transition-colors hover:bg-secondary/50">
                  <td className="py-4 pr-4 first:pl-0">
                    <p className="font-semibold text-foreground">{order.orderNo ?? order.id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatOrderDate(order)}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/users/${order.userId}`} className="font-semibold text-foreground hover:underline">
                      {order.userName}
                    </Link>
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
                  <td className="px-4 py-4">
                    <div className="grid gap-2">
                      <input
                        value={deliveryDrafts[order.id]?.courier ?? ""}
                        onChange={(event) =>
                          setDeliveryDrafts((current) => ({
                            ...current,
                            [order.id]: {
                              courier: event.target.value,
                              invoiceNo: current[order.id]?.invoiceNo ?? "",
                            },
                          }))
                        }
                        placeholder="택배사"
                        className="h-9 rounded-md border border-border bg-background px-3 text-xs outline-none"
                      />
                      <input
                        value={deliveryDrafts[order.id]?.invoiceNo ?? ""}
                        onChange={(event) =>
                          setDeliveryDrafts((current) => ({
                            ...current,
                            [order.id]: {
                              courier: current[order.id]?.courier ?? "",
                              invoiceNo: event.target.value,
                            },
                          }))
                        }
                        placeholder="송장번호"
                        className="h-9 rounded-md border border-border bg-background px-3 text-xs outline-none"
                      />
                      <button
                        type="button"
                        disabled={updatingId === order.id}
                        onClick={async () => {
                          setUpdatingId(order.id);
                          setError("");
                          try {
                            await updateAdminOrderDelivery(order.id, deliveryDrafts[order.id] ?? {});
                            await loadOrders();
                          } catch (adminError) {
                            setError(
                              adminError instanceof Error
                                ? adminError.message
                                : "배송 정보를 저장하지 못했어요."
                            );
                          } finally {
                            setUpdatingId("");
                          }
                        }}
                        className="text-left text-xs font-semibold text-foreground underline-offset-4 hover:underline"
                      >
                        배송 정보 저장
                      </button>
                    </div>
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
                              option.value === order.status
                                ? false
                                : order.status === "pending"
                                  ? !["paid", "cancelled"].includes(option.value)
                                  : ["pending", "paid", "failed"].includes(option.value)
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

const importStatusLabels: Record<LogiiImportRowStatus, string> = {
  linked: "연동 완료",
  unchanged: "이미 연동됨",
  ambiguous: "확인 필요",
  unmatched: "외부 고객 저장",
};

const importStatusClasses: Record<LogiiImportRowStatus, string> = {
  linked: "text-emerald-700",
  unchanged: "text-sky-700",
  ambiguous: "text-amber-700",
  unmatched: "text-rose-700",
};

function LogiiImportReportPanel({
  report,
  onClose,
}: {
  report: LogiiImportReport;
  onClose: () => void;
}) {
  const summaryItems = [
    ["전체", report.summary.total],
    ["연동 완료", report.summary.linked],
    ["이미 연동", report.summary.unchanged],
    ["확인 필요", report.summary.ambiguous],
    ["외부 고객 저장", report.summary.unmatched],
  ] as const;

  return (
    <section className="rounded-lg border border-border bg-secondary/40">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            로지아이 배송 연동 결과
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{report.fileName}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {summaryItems.map(([label, value]) => (
              <span key={label} className="text-xs text-muted-foreground">
                {label} <strong className="text-foreground">{value}</strong>
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          결과 닫기
        </button>
      </div>

      <div className="max-h-[420px] overflow-auto">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="sticky top-0 bg-secondary">
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-5 py-3 font-semibold">행</th>
              <th className="px-4 py-3 font-semibold">받는 분 / 물품</th>
              <th className="px-4 py-3 font-semibold">로지아이 정보</th>
              <th className="px-4 py-3 font-semibold">연동 주문</th>
              <th className="px-4 py-3 font-semibold">결과</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {report.rows.map((row) => (
              <tr key={`${row.rowNumber}-${row.reservationNo}`}>
                <td className="px-5 py-3 tabular-nums text-muted-foreground">
                  {row.rowNumber}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground">{row.recipientName}</p>
                  <p className="mt-1 text-muted-foreground">{row.itemName}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p>{row.service}</p>
                  <p className="mt-1 tabular-nums">
                    예약 {row.reservationNo}
                    {row.invoiceNo ? ` · 송장 ${row.invoiceNo}` : " · 송장 미발급"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {row.orderId ? (
                    <>
                      <Link
                        href={row.userId ? `/admin/users/${row.userId}` : "/admin/users"}
                        className="font-semibold text-foreground hover:underline"
                      >
                        {row.customerName || "고객"}
                      </Link>
                      <p className="mt-1 tabular-nums text-muted-foreground">
                        {row.orderNo}
                      </p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className={`font-semibold ${importStatusClasses[row.status]}`}>
                    {importStatusLabels[row.status]}
                  </p>
                  <p className="mt-1 max-w-sm leading-5 text-muted-foreground">
                    {row.message}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
