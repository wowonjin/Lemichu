"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight, Heart, Truck } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { getAccountBenefits } from "@/lib/accountBenefits";
import { formatPrice, formatPriceWithUnit } from "@/lib/formatPrice";
import {
  countOrdersByStatus,
  getActiveOrders,
  ORDER_SUMMARY_ITEMS,
} from "@/lib/orderStatus";
import { readAlertReads, writeAlertReads } from "@/lib/accountStorage";
import { resolveRecentlyViewedProducts } from "@/lib/recentlyViewed";
import { getWishlistInsight, wishlistOwnerId } from "@/lib/wishlist";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/product/ProductCard";
import { AuthGate } from "./AuthGate";
import {
  AccountCtaLink,
  AccountEmptyState,
  AccountErrorState,
  AccountSection,
  AccountSkeleton,
} from "./AccountPageShell";
import { OrderCard } from "./OrderCard";

const supportLinks = [
  { label: "주문 및 배송 문의", href: "/my/inquiries" },
  { label: "취소·교환·반품", href: "/my/returns" },
  { label: "정품 검수 안내", href: "/authentication" },
  { label: "1:1 문의", href: "/my/inquiries" },
  { label: "자주 묻는 질문", href: "/my/faq" },
];

export function MyDashboard({ products }: { products: Product[] }) {
  return (
    <AuthGate description="로그인하면 진행 중인 주문과 관심 상품을 한곳에서 확인할 수 있어요.">
      <DashboardBody products={products} />
    </AuthGate>
  );
}

function DashboardBody({ products }: { products: Product[] }) {
  const { user } = useAuthUser();
  const { orders, status, error, retry } = usePurchaseOrders();
  const { records, count: wishCount } = useWishlist();
  const benefits = getAccountBenefits();
  const [considerTab, setConsiderTab] = useState<"wishlist" | "recent">("wishlist");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const wishEntries = useMemo(
    () =>
      records
        .map((record) => {
          const product = productById.get(record.productId);
          return product ? { product, record } : null;
        })
        .filter((item): item is { product: Product; record: (typeof records)[number] } => Boolean(item)),
    [productById, records]
  );

  useEffect(() => {
    setRecent(resolveRecentlyViewedProducts(products).map((item) => item.product));
    if (user) {
      setReadIds(readAlertReads(wishlistOwnerId(user.uid)));
    }
  }, [products, user]);

  const alerts = useMemo(() => {
    return wishEntries
      .map((entry) => {
        const insight = getWishlistInsight(entry.product, entry.record);
        if (!insight) return null;
        if (insight.kind === "low-stock") return null;
        return {
          id: `${insight.kind}:${entry.product.id}`,
          href: entry.product.href,
          message:
            insight.kind === "price-drop"
              ? `찜한 ${entry.product.brand} 상품 가격이 ${formatPrice(entry.record.priceAtAdd - entry.product.price)}원 내려갔어요.`
              : `찜한 ${entry.product.brand} 상품이 오늘 출고 가능이에요.`,
          timeLabel: "찜한 이후 변동",
          kind: insight.kind,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .slice(0, 5);
  }, [wishEntries]);

  const previewWish = useMemo(() => {
    const priceDropped = wishEntries.filter((item) => item.record.priceAtAdd > item.product.price);
    const todayShip = wishEntries.filter((item) => item.product.deliveryBadge === "오늘출고");
    const rest = wishEntries.filter(
      (item) => !priceDropped.includes(item) && !todayShip.includes(item)
    );
    return [...priceDropped, ...todayShip, ...rest].slice(0, 4).map((item) => item.product);
  }, [wishEntries]);

  const activeOrders = getActiveOrders(orders);
  const statusCounts = countOrdersByStatus(orders);

  useEffect(() => {
    if (previewWish.length === 0 && recent.length > 0) {
      setConsiderTab("recent");
    }
  }, [previewWish.length, recent.length]);

  const displayName = user?.name?.trim() || "회원";

  const markRead = (id: string) => {
    if (!user) return;
    const next = Array.from(new Set([...readIds, id]));
    setReadIds(next);
    writeAlertReads(wishlistOwnerId(user.uid), next);
  };

  const benefitItems = [
    { label: "적립금", value: formatPrice(benefits.points), unit: "원", href: "/my/points" },
    { label: "쿠폰", value: String(benefits.couponCount), unit: "장", href: "/my/coupons" },
    { label: "찜", value: String(wishCount), unit: "개", href: "/my/wishlist" },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-md bg-secondary px-5 py-6 md:px-6">
        <p className="text-[13px] font-medium text-muted-foreground">마이페이지</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">
            {displayName}님, 안녕하세요
          </h1>
          <Link
            href="/my/settings"
            className="inline-flex h-10 items-center gap-0.5 text-[14px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            계정 설정
            <ChevronRight className="size-4" strokeWidth={1.8} />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {benefitItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md bg-secondary px-3 py-5 text-center transition-colors hover:bg-secondary/80"
          >
            <p className="text-[20px] font-bold tabular-nums leading-none tracking-tight text-foreground md:text-[22px]">
              {item.value}
              <span className="ml-0.5 text-[12px] font-semibold text-muted-foreground">{item.unit}</span>
            </p>
            <p className="mt-2 text-[12px] font-medium text-muted-foreground">{item.label}</p>
          </Link>
        ))}
      </section>

      <AccountSection title="진행 중인 주문">
        {status === "loading" ? <AccountSkeleton rows={2} /> : null}
        {status === "error" ? <AccountErrorState message={error} onRetry={retry} /> : null}
        {status === "ready" && activeOrders.length === 0 ? (
          <AccountEmptyState
            title="진행 중인 주문이 없어요"
            action={<AccountCtaLink href="/ranking">이번 주 인기 상품 보기</AccountCtaLink>}
          />
        ) : null}
        {status === "ready"
          ? activeOrders.slice(0, 2).map((order) => (
              <OrderCard key={order.id} order={order} emphasizeArrival />
            ))
          : null}
      </AccountSection>

      <AccountSection
        title="주문 현황"
        action={
          <Link
            href="/my/orders"
            className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
          >
            전체보기
            <ChevronRight className="size-4" strokeWidth={1.8} />
          </Link>
        }
      >
        <div className="grid grid-cols-4">
          {ORDER_SUMMARY_ITEMS.map((item) => {
            const count = statusCounts[item.key];
            return (
              <Link
                key={item.key}
                href={item.href}
                className="rounded-2xl py-4 text-center transition-colors hover:bg-background/70"
              >
                <p
                  className={`text-[22px] font-bold tabular-nums ${
                    count > 0 ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {count}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">{item.label}</p>
              </Link>
            );
          })}
        </div>
      </AccountSection>

      <AccountSection title="내 명품 판매 현황">
        <div className="grid grid-cols-5 text-center">
          {["접수", "수거 중", "검수 중", "판매 중", "정산 완료"].map((label) => (
            <div key={label} className="rounded-2xl py-4">
              <p className="text-[22px] font-bold tabular-nums text-muted-foreground">0</p>
              <p className="mt-1 text-[12px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <AccountEmptyState
          title="판매할 명품이 있으신가요?"
          description="사진만 올리면 예상 시세를 확인할 수 있어요."
          action={<AccountCtaLink href="/my/estimate">내 명품 시세 확인하기</AccountCtaLink>}
        />
      </AccountSection>

      <AccountSection
        title="맞춤 알림"
        action={
          <Link
            href="/my/notifications"
            className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
          >
            전체보기
            <ChevronRight className="size-4" strokeWidth={1.8} />
          </Link>
        }
      >
        {alerts.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-muted-foreground">아직 확인할 알림이 없어요.</p>
        ) : (
          <ul className="divide-y divide-border">
            {alerts.map((alert) => {
              const unread = !readIds.includes(alert.id);
              return (
                <li key={alert.id}>
                  <div className="flex items-start gap-3 py-4">
                    <span className="mt-0.5 grid size-11 place-items-center rounded-md bg-secondary text-foreground">
                      {alert.kind === "price-drop" ? (
                        <Heart className="size-4" />
                      ) : alert.kind === "today-ship" ? (
                        <Truck className="size-4" />
                      ) : (
                        <Bell className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] text-foreground">
                        {unread ? <span className="mr-2 text-[11px] font-bold text-gold">NEW</span> : null}
                        {alert.message}
                      </p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{alert.timeLabel}</p>
                      <div className="mt-3 flex gap-4 text-[13px] font-semibold">
                        <Link href={alert.href} className="text-foreground underline-offset-4 hover:underline">
                          상품 보기
                        </Link>
                        <button
                          type="button"
                          onClick={() => markRead(alert.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          알림 확인
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AccountSection>

      <AccountSection title="구매를 고민 중인 상품">
        <div className="flex gap-2 rounded-md bg-secondary p-1" role="tablist" aria-label="고민 중인 상품">
          {[
            { key: "wishlist" as const, label: "찜한 상품", count: wishEntries.length },
            { key: "recent" as const, label: "최근 본 상품", count: recent.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={considerTab === tab.key}
              onClick={() => setConsiderTab(tab.key)}
              className={`min-h-10 flex-1 rounded-md border text-[13px] transition-colors ${
                considerTab === tab.key
                  ? "border-border bg-background font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {considerTab === "wishlist" ? (
            previewWish.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {previewWish.map((product) => (
                  <ProductCard key={product.id} product={product} variant="wishlist" />
                ))}
              </div>
            ) : (
              <AccountEmptyState
                title="아직 찜한 상품이 없어요"
                action={<AccountCtaLink href="/ranking">인기 상품 둘러보기</AccountCtaLink>}
              />
            )
          ) : recent.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {recent.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <AccountEmptyState
              title="최근 본 상품이 없어요"
              action={<AccountCtaLink href="/new-arrivals">상품 둘러보기</AccountCtaLink>}
            />
          )}
        </div>
      </AccountSection>

      <AccountSection title="고객지원">
        <ul>
          {supportLinks.map((item) => (
            <li key={`${item.label}-${item.href}`}>
              <Link
                href={item.href}
                className="flex min-h-12 items-center justify-between rounded-2xl px-1 text-[15px] font-medium text-foreground transition-colors hover:bg-background/70"
              >
                {item.label}
                <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.8} />
              </Link>
            </li>
          ))}
        </ul>
      </AccountSection>
    </div>
  );
}
