"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CreditCard,
  PackageCheck,
  ShoppingBag,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import { AdminMetricCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { SalesAreaChart, StatusBars } from "@/components/admin/Charts";
import {
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminUsers,
  type AdminUserProfile,
} from "@/lib/admin";
import { fetchAdminMemberOverview } from "@/lib/member-account-client";
import { buildDailySales, buildStatusBreakdown, buildTrend } from "@/lib/adminStats";
import { formatOrderDate, type OrderStatus, type PurchaseOrder } from "@/lib/orders";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { cn } from "@/lib/cn";
import type { StoreProduct } from "@/lib/products";

const statusBadgeClass: Record<OrderStatus, string> = {
  pending: "bg-secondary text-muted-foreground",
  paid: "bg-emerald-50 text-emerald-600",
  failed: "bg-rose-50 text-rose-600",
  preparing: "bg-amber-50 text-amber-600",
  shipping: "bg-sky-50 text-sky-600",
  delivered: "bg-secondary text-foreground",
  cancelled: "bg-rose-50 text-rose-600",
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

export function AdminDashboard() {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [memberOverview, setMemberOverview] = useState({
    pendingSell: 0,
    unreadNotifications: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");

      const errors: string[] = [];

      const loadUsers = fetchAdminUsers()
        .then((nextUsers) => {
          if (!cancelled) setUsers(nextUsers);
        })
        .catch((adminError) => {
          errors.push(adminError instanceof Error ? adminError.message : "회원 목록을 불러오지 못했어요.");
        });

      const loadOrders = fetchAdminOrders()
        .then((nextOrders) => {
          if (!cancelled) setOrders(nextOrders);
        })
        .catch((adminError) => {
          errors.push(adminError instanceof Error ? adminError.message : "주문 목록을 불러오지 못했어요.");
        });

      const loadProducts = fetchAdminProducts()
        .then((nextProducts) => {
          if (!cancelled) setProducts(nextProducts);
        })
        .catch((adminError) => {
          errors.push(adminError instanceof Error ? adminError.message : "상품 목록을 불러오지 못했어요.");
        });

      const loadOverview = fetchAdminMemberOverview()
        .then((nextOverview) => {
          if (!cancelled && nextOverview) setMemberOverview(nextOverview);
        })
        .catch(() => undefined);

      await Promise.all([loadUsers, loadOrders, loadProducts, loadOverview]);

      if (!cancelled) {
        setError(errors[0] ?? "");
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const revenue = useMemo(
    () =>
      orders.reduce(
        (sum, order) => (isRevenueOrder(order) ? sum + order.amounts.finalTotal : sum),
        0
      ),
    [orders]
  );
  const paidOrders = orders.filter(isRevenueOrder).length;
  const latestOrders = orders.slice(0, 6);
  const dailySales = useMemo(() => buildDailySales(orders, 14), [orders]);
  const statusBreakdown = useMemo(() => buildStatusBreakdown(orders), [orders]);
  const trend = useMemo(() => buildTrend(orders, 7), [orders]);

  const toDelta = (value: number | null, label: string) =>
    value == null ? null : { value, label };

  return (
    <div className="mx-auto w-full max-w-[1240px]">
      <AdminPageHeader title="대시보드" />

      {error ? <AdminNotice message={error} /> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricSurface>
          <AdminMetricCard
            label="전체 회원"
            value={users.length === 0 && isLoading ? "-" : `${users.length}명`}
            icon={UsersIcon}
          />
        </MetricSurface>
        <MetricSurface>
          <AdminMetricCard
            label="등록 상품"
            value={products.length === 0 && isLoading ? "-" : `${products.length}개`}
            icon={ShoppingBag}
          />
        </MetricSurface>
        <MetricSurface>
          <AdminMetricCard
            label="전체 주문"
            value={orders.length === 0 && isLoading ? "-" : `${orders.length}건`}
            icon={PackageCheck}
            delta={orders.length === 0 && isLoading ? null : toDelta(trend.orders.value, trend.orders.label)}
          />
        </MetricSurface>
        <MetricSurface>
          <AdminMetricCard
            label="결제완료"
            value={orders.length === 0 && isLoading ? "-" : `${paidOrders}건`}
            icon={CreditCard}
          />
        </MetricSurface>
        <MetricSurface>
          <AdminMetricCard
            label="누적 매출"
            value={orders.length === 0 && isLoading ? "-" : formatPriceWithUnit(revenue)}
            icon={TrendingUp}
            delta={orders.length === 0 && isLoading ? null : toDelta(trend.revenue.value, trend.revenue.label)}
          />
        </MetricSurface>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[18px] bg-[#f7f8fa] p-5 sm:p-6 dark:bg-secondary/60">
          <h3 className="text-base font-semibold text-foreground">매출 추이</h3>
          <div className="mt-5">
            {orders.length === 0 && isLoading ? (
              <div className="grid h-[220px] place-items-center text-sm text-muted-foreground">
                매출 데이터를 불러오는 중입니다.
              </div>
            ) : (
              <SalesAreaChart data={dailySales} />
            )}
          </div>
        </div>

        <div className="rounded-[18px] bg-[#f7f8fa] p-5 sm:p-6 dark:bg-secondary/60">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-foreground">주문 상태 분포</h3>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-0.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              주문 관리
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="mt-5">
            {orders.length === 0 && isLoading ? (
              <div className="grid h-[220px] place-items-center text-sm text-muted-foreground">
                불러오는 중입니다.
              </div>
            ) : statusBreakdown.length > 0 ? (
              <StatusBars data={statusBreakdown} />
            ) : (
              <EmptyAdminState text="아직 저장된 주문이 없습니다." />
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[18px] bg-[#f7f8fa] p-5 sm:p-6 dark:bg-secondary/60">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-foreground">최근 주문</h3>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-0.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              전체보기
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="mt-5 divide-y divide-border/70">
            {latestOrders.length > 0 ? (
              latestOrders.map((order) => <RecentOrder key={order.id} order={order} />)
            ) : (
              <EmptyAdminState text="아직 저장된 주문이 없습니다." />
            )}
          </div>
        </div>

        <div className="rounded-[18px] bg-[#f7f8fa] p-5 sm:p-6 dark:bg-secondary/60">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-foreground">최근 회원</h3>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-0.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              회원 목록
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="mt-5 divide-y divide-border/70">
            {users.slice(0, 5).length > 0 ? (
              users.slice(0, 5).map((user) => <RecentUser key={user.uid} user={user} />)
            ) : (
              <EmptyAdminState text="아직 저장된 회원 프로필이 없습니다." />
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[18px] bg-[#f7f8fa] p-5 sm:p-6 dark:bg-secondary/60">
        <h3 className="text-base font-semibold text-foreground">마이페이지 연동</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { href: "/admin/sell", label: "진행 중 판매", value: memberOverview.pendingSell },
            { href: "/admin/notifications", label: "미확인 알림", value: memberOverview.unreadNotifications },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between rounded-[14px] bg-background px-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground">{isLoading ? "-" : item.value}</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricSurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[18px] bg-[#f7f8fa] p-5 dark:bg-secondary/60">
      {children}
    </div>
  );
}

function isRevenueOrder(order: PurchaseOrder) {
  const itemName = `${order.items?.[0]?.brand ?? ""} ${order.items?.[0]?.name ?? ""}`;
  if (itemName.includes("검수")) return false;
  return ["paid", "preparing", "shipping", "delivered"].includes(order.status);
}

export function AdminNotice({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-[14px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-950/30">
      {message}
    </div>
  );
}

export function EmptyAdminState({ text }: { text: string }) {
  return (
    <div className="py-10 text-center text-sm font-medium text-muted-foreground">{text}</div>
  );
}

function RecentOrder({ order }: { order: PurchaseOrder }) {
  const firstItem = order.items?.[0];
  const customer = [order.userName, order.userEmail].filter(Boolean).join(" · ");
  const total = Number(order.amounts?.finalTotal) || 0;

  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {firstItem ? `${firstItem.brand} ${firstItem.name}`.trim() : "주문 상품"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {customer ? `${customer} · ` : ""}
          {formatOrderDate(order)}
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {total > 0 ? formatPriceWithUnit(total) : "-"}
        </p>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            statusBadgeClass[order.status] ?? "bg-secondary text-foreground"
          )}
        >
          {statusLabels[order.status] ?? order.status}
        </span>
      </div>
    </div>
  );
}

function RecentUser({ user }: { user: AdminUserProfile }) {
  return (
    <Link href={`/admin/users/${user.uid}`} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-background text-sm font-bold text-foreground">
        {user.name?.slice(0, 1) || "U"}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <span className="ml-auto text-xs font-semibold text-muted-foreground">{user.role}</span>
    </Link>
  );
}
