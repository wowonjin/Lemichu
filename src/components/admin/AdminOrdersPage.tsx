"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, FileSpreadsheet, Loader2, PackageCheck, Search, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
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
  type PaymentStatus,
  type PurchaseOrder,
} from "@/lib/orders";
import { toDateValue } from "@/lib/admin-serialize";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { isRealImage } from "@/lib/placeholder";
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

const paymentStatusLabels: Record<PaymentStatus, string> = {
  WAITING_FOR_DEPOSIT: "입금대기",
  PENDING: "결제처리중",
  PAID: "결제완료",
  FAILED: "결제실패",
  CANCELLED: "결제취소",
};

function paymentMethodLabel(order: PurchaseOrder) {
  if (order.paymentMethod === "BANK_TRANSFER") return "무통장입금";
  if (order.paymentMethod === "TOSS_CARD") return "신용카드";
  if (order.paymentMethod === "TOSS_TRANSFER") return "계좌이체";
  if (order.paymentMethod === "POINTS") return "적립금";
  return order.payment?.method || "";
}

function deliveryAddress(order: PurchaseOrder) {
  const delivery = order.delivery;
  return [delivery?.address1, delivery?.address2].filter(Boolean).join(" ");
}

function formatDateTime(value: unknown) {
  const date = toDateValue(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

const toolbarButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50";

export function AdminOrdersPage() {
  const logiiFileInputRef = useRef<HTMLInputElement>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [query, setQuery] = useState("");
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
    if (!keyword) return orders;

    return orders.filter((order) => {
      const firstItem = order.items[0];
      return [
        order.id,
        order.orderNo,
        order.userEmail,
        order.userName,
        order.depositorName,
        order.paymentStatus,
        order.delivery?.recipientName,
        order.delivery?.phone,
        order.delivery?.postalCode,
        order.delivery?.address1,
        order.delivery?.address2,
        firstItem?.brand,
        firstItem?.name,
      ].some((value) => value?.toLowerCase().includes(keyword));
    });
  }, [orders, query]);

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

  const handleDeliverySave = async (orderId: string) => {
    setUpdatingId(orderId);
    setError("");

    try {
      await updateAdminOrderDelivery(orderId, deliveryDrafts[orderId] ?? {});
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

  const emptyText = orders.length === 0
    ? "아직 들어온 주문이 없습니다."
    : "조건에 맞는 주문이 없습니다.";

  return (
    <div className="mx-auto w-full max-w-[1120px]">
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
            <button
              type="button"
              disabled={isImportingLogii}
              onClick={() => logiiFileInputRef.current?.click()}
              className={toolbarButtonClass}
            >
              {isImportingLogii ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="size-4" />
              )}
              {isImportingLogii ? "주문 찾는 중..." : "로지아이 엑셀 연동"}
            </button>
            <button
              type="button"
              disabled={isLoading || deliveryExportOrders.length === 0}
              onClick={handleDeliveryExport}
              className={toolbarButtonClass}
            >
              <Download className="size-4" />
              택배 엑셀 다운로드
            </button>
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

      <section>
        <label className="mb-4 flex h-11 items-center gap-2 rounded-md bg-secondary px-3.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="주문번호, 고객, 입금자, 배송지, 상품 검색"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>

        <p className="mb-3 text-xs font-medium text-muted-foreground">
          {isLoading ? "불러오는 중" : `${filteredOrders.length}건`}
        </p>

        <div className="divide-y divide-border border-y border-border">
          {isLoading ? (
            <EmptyAdminState text="주문 목록을 불러오는 중입니다." />
          ) : filteredOrders.length === 0 ? (
            <OrdersEmptyState text={emptyText} hasOrders={orders.length > 0} />
          ) : (
            filteredOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                deliveryDraft={deliveryDrafts[order.id] ?? { courier: "", invoiceNo: "" }}
                isUpdating={updatingId === order.id}
                onDeliveryDraftChange={(field, value) =>
                  setDeliveryDrafts((current) => ({
                    ...current,
                    [order.id]: {
                      courier: current[order.id]?.courier ?? "",
                      invoiceNo: current[order.id]?.invoiceNo ?? "",
                      [field]: value,
                    },
                  }))
                }
                onDeliverySave={() => void handleDeliverySave(order.id)}
                onStatusChange={(nextStatus) => void handleStatusChange(order.id, nextStatus)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function OrdersEmptyState({ text, hasOrders }: { text: string; hasOrders: boolean }) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-secondary">
        <PackageCheck className="size-5 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{text}</p>
      <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">
        {hasOrders
          ? "검색어를 바꿔 다시 찾아보세요."
          : "사이트에서 결제가 완료되면 주문과 배송 정보를 여기서 처리할 수 있습니다."}
      </p>
    </div>
  );
}

function OrderRow({
  order,
  deliveryDraft,
  isUpdating,
  onDeliveryDraftChange,
  onDeliverySave,
  onStatusChange,
}: {
  order: PurchaseOrder;
  deliveryDraft: { courier: string; invoiceNo: string };
  isUpdating: boolean;
  onDeliveryDraftChange: (field: "courier" | "invoiceNo", value: string) => void;
  onDeliverySave: () => void;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const items = order.items ?? [];
  const firstItem = items[0];
  const extraCount = Math.max(items.length - 1, 0);
  const canManageFulfillment = !["failed", "cancelled"].includes(order.status);
  const total = Number(order.amounts?.finalTotal) || 0;
  const isGuest = order.isGuest === true || order.source === "web-guest-bank-transfer";
  const address = deliveryAddress(order);
  const paymentMethod = paymentMethodLabel(order);
  const productName = firstItem
    ? `${firstItem.brand} ${firstItem.name}`.trim()
    : "주문 상품";
  const imageUrl = firstItem?.imageUrl ?? "";
  const hasImage = Boolean(imageUrl && isRealImage(imageUrl));

  return (
    <article className="py-5 sm:py-6">
      <div className="flex gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-md bg-secondary sm:size-[72px]">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={productName}
              width={72}
              height={72}
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center">
              <PackageCheck className="size-5 text-muted-foreground/70" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-bold tracking-tight text-foreground">
                  {order.orderNo ?? order.id}
                </h3>
                <StatusBadge status={order.status} />
                {isGuest ? (
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                    비회원
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{formatOrderDate(order)}</p>
              <p className="mt-2.5 truncate text-sm font-semibold text-foreground">
                {productName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                수량 {order.itemCount || items.length || 1}개
                {extraCount > 0 ? ` · 외 ${extraCount}개 상품` : ""}
                {firstItem?.option ? ` · ${firstItem.option}` : ""}
              </p>
            </div>
            <p className="shrink-0 text-lg font-bold tabular-nums tracking-tight text-foreground sm:pt-0.5">
              {total > 0 ? formatPriceWithUnit(total) : "-"}
            </p>
          </div>

          <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <InfoBlock label="고객">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {order.userId && !isGuest ? (
                  <Link
                    href={`/admin/users/${order.userId}`}
                    className="font-semibold text-foreground hover:underline"
                  >
                    {order.userName || "고객"}
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground">
                    {order.userName || "고객"}
                  </span>
                )}
                {order.userEmail ? (
                  <span className="break-all text-muted-foreground">{order.userEmail}</span>
                ) : null}
              </div>
            </InfoBlock>

            <InfoBlock label="결제">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-foreground">
                  {paymentMethod || "-"}
                </span>
                {order.paymentStatus ? (
                  <span className="text-muted-foreground">
                    {paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}
                  </span>
                ) : null}
              </div>
              {order.depositorName ? (
                <p className="mt-1 text-muted-foreground">입금자 {order.depositorName}</p>
              ) : null}
              {order.paymentStatus === "WAITING_FOR_DEPOSIT" && order.depositDueAt ? (
                <p className="mt-1 text-amber-700 dark:text-amber-400">
                  입금 기한 {formatDateTime(order.depositDueAt)}
                </p>
              ) : null}
            </InfoBlock>

            <InfoBlock label="배송지" className="sm:col-span-2">
              <p className="font-semibold text-foreground">
                {[order.delivery?.recipientName || order.userName, order.delivery?.phone]
                  .filter(Boolean)
                  .join(" · ") || "-"}
              </p>
              {address ? (
                <p className="mt-1 leading-5 text-muted-foreground">
                  {order.delivery?.postalCode ? `[${order.delivery.postalCode}] ` : ""}
                  {address}
                </p>
              ) : (
                <p className="mt-1 text-rose-600">배송지 미입력</p>
              )}
              {order.delivery?.message ? (
                <p className="mt-1 leading-5 text-muted-foreground">
                  요청사항 {order.delivery.message}
                </p>
              ) : null}
            </InfoBlock>
          </dl>
        </div>
      </div>

      {canManageFulfillment ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[160px_1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">
              주문 상태
            </span>
            <select
              value={order.status}
              disabled={isUpdating}
              onChange={(event) => onStatusChange(event.target.value as OrderStatus)}
              aria-label={`${order.orderNo ?? order.id} 주문 상태`}
              className="h-11 w-full rounded-md bg-secondary px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
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
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">
              택배사
            </span>
            <input
              value={deliveryDraft.courier}
              onChange={(event) => onDeliveryDraftChange("courier", event.target.value)}
              placeholder="택배사"
              aria-label={`${order.orderNo ?? order.id} 택배사`}
              className="h-11 w-full rounded-md bg-secondary px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/10"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">
              송장번호
            </span>
            <input
              value={deliveryDraft.invoiceNo}
              onChange={(event) => onDeliveryDraftChange("invoiceNo", event.target.value)}
              placeholder="송장번호"
              aria-label={`${order.orderNo ?? order.id} 송장번호`}
              className="h-11 w-full rounded-md bg-secondary px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/10"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              disabled={isUpdating}
              onClick={onDeliverySave}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-50 lg:w-auto"
            >
              {isUpdating ? <Loader2 className="size-4 animate-spin" /> : null}
              {isUpdating ? "저장 중" : "저장"}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-bold",
        statusTextClass[status] ?? "text-muted-foreground"
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", statusDotClass[status] ?? "bg-muted-foreground")}
      />
      {statusLabels[status] ?? status}
    </span>
  );
}

function InfoBlock({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 text-sm", className)}>
      <dt className="mb-1 text-[11px] font-semibold text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
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
    <section className="mb-6 overflow-hidden rounded-[14px] bg-[#f7f8fa] dark:bg-secondary/60">
      <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">로지아이 배송 연동 결과</p>
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
          className="inline-flex h-9 items-center gap-1 self-start text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
          닫기
        </button>
      </div>

      <div className="max-h-[420px] overflow-auto border-t border-border/70">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="sticky top-0 bg-[#eef0f3] dark:bg-secondary">
            <tr className="text-muted-foreground">
              <th className="px-5 py-3 font-semibold">행</th>
              <th className="px-4 py-3 font-semibold">받는 분 / 물품</th>
              <th className="px-4 py-3 font-semibold">로지아이 정보</th>
              <th className="px-4 py-3 font-semibold">연동 주문</th>
              <th className="px-4 py-3 font-semibold">결과</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
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
