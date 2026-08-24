"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, ChevronRight, Heart, Truck } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthUser } from "@/hooks/useAuthUser";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { useAccountBenefits } from "@/hooks/useAccountBenefits";
import { formatPrice } from "@/lib/formatPrice";
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
  AccountMoreLink,
  AccountSection,
  AccountSkeleton,
  AccountStatRow,
} from "./AccountPageShell";
import { OrderCard } from "./OrderCard";
import { useMyNotificationInbox, useSellDashboardStats } from "./AccountLinkedViews";
import { SELL_DASHBOARD_STEPS, countSellByStatus, formatMemberDate } from "@/lib/member-account";
import { markMyNotificationsRead } from "@/lib/member-account-client";
import { KakaoCsLink } from "./KakaoCsLink";

const supportLinks = [
  { label: "카카오톡 고객센터", href: "kakao" },
  { label: "취소·교환·반품", href: "/my/returns" },
  { label: "정품 검수 안내", href: "/authentication" },
  { label: "자주 묻는 질문", href: "/my/faq" },
];

function SupportSection() {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-md bg-secondary px-5 py-5 md:px-6 md:py-6">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <h2 className="text-[17px] font-bold tracking-tight text-foreground">고객지원</h2>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open && "rotate-180"
          )}
          strokeWidth={1.8}
        />
      </button>
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <ul className="-mb-1 mt-5 divide-y divide-border border-t border-border">
            {supportLinks.map((item) => (
              <li key={`${item.label}-${item.href}`}>
                {item.href === "kakao" ? (
                  <KakaoCsLink className="flex min-h-12 items-center justify-between text-[15px] font-medium text-foreground transition-opacity hover:opacity-70">
                    {item.label}
                    <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.8} />
                  </KakaoCsLink>
                ) : (
                  <Link
                    href={item.href}
                    className="flex min-h-12 items-center justify-between text-[15px] font-medium text-foreground transition-opacity hover:opacity-70"
                  >
                    {item.label}
                    <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.8} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

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
  const { benefits } = useAccountBenefits();
  const sellRequests = useSellDashboardStats();
  const inbox = useMyNotificationInbox();
  const sellCounts = countSellByStatus(sellRequests.data.filter((item) => item.kind !== "estimate"));
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

  const markRead = (id: string) => {
    if (!user) return;
    const next = Array.from(new Set([...readIds, id]));
    setReadIds(next);
    writeAlertReads(wishlistOwnerId(user.uid), next);
  };

  const benefitItems = [
    { key: "points", label: "적립금", value: formatPrice(benefits.points), unit: "원", href: "/my/points", emphasize: true },
    { key: "coupons", label: "쿠폰", value: String(benefits.couponCount), unit: "장", href: "/my/coupons", emphasize: true },
    { key: "wishlist", label: "찜", value: String(wishCount), unit: "개", href: "/my/wishlist", emphasize: true },
  ];

  return (
    <div className="space-y-3">
      <AccountSection
        title="마이페이지"
        titleSize="lg"
        action={<AccountMoreLink href="/my/settings">계정 설정</AccountMoreLink>}
      >
        <AccountStatRow items={benefitItems} />
      </AccountSection>

      <AccountSection title="진행 중인 주문" action={<AccountMoreLink href="/my/orders" />}>
        {status === "loading" ? <AccountSkeleton rows={2} /> : null}
        {status === "error" ? <AccountErrorState message={error} onRetry={retry} /> : null}
        {status === "ready" && activeOrders.length === 0 ? (
          <AccountEmptyState
            compact
            title="진행 중인 주문이 없어요"
            action={
              <AccountCtaLink href="/products" variant="ghost">
                이번 주 인기 상품 보기
                <ChevronRight className="size-4" strokeWidth={1.8} />
              </AccountCtaLink>
            }
          />
        ) : null}
        {status === "ready" && activeOrders.length > 0 ? (
          <div className="divide-y divide-border">
            {activeOrders.slice(0, 2).map((order) => (
              <OrderCard key={order.id} order={order} emphasizeArrival className="first:pt-0 last:pb-0" />
            ))}
          </div>
        ) : null}
      </AccountSection>

      <AccountSection title="주문 현황" action={<AccountMoreLink href="/my/orders" />}>
        <AccountStatRow
          items={ORDER_SUMMARY_ITEMS.map((item) => ({
            key: item.key,
            label: item.label,
            value: statusCounts[item.key],
            href: item.href,
            emphasize: statusCounts[item.key] > 0,
          }))}
        />
      </AccountSection>

      <AccountSection title="내 명품 판매 현황" action={<AccountMoreLink href="/my/sell" />}>
        <AccountStatRow
          items={SELL_DASHBOARD_STEPS.map((step) => ({
            key: step.key,
            label: step.label,
            value: sellCounts[step.key],
            emphasize: sellCounts[step.key] > 0,
            href: step.key === "settled" ? "/my/settlement" : step.key === "inspecting" ? "/my/inspection" : "/my/sell",
          }))}
        />
        <div className="mt-5 border-t border-border">
          {sellRequests.data.length === 0 ? (
            <AccountEmptyState
              compact
              title="판매할 명품이 있으신가요?"
              description="접수하면 관리자가 검수와 정산 상태를 업데이트해요."
              action={
                <AccountCtaLink href="/my/estimate" variant="ghost">
                  내 명품 시세 확인하기
                  <ChevronRight className="size-4" strokeWidth={1.8} />
                </AccountCtaLink>
              }
            />
          ) : (
            <p className="pt-4 text-[14px] text-muted-foreground">
              최근 접수 {sellRequests.data[0].brand} {sellRequests.data[0].itemName}
            </p>
          )}
        </div>
      </AccountSection>

      <AccountSection title="맞춤 알림" action={<AccountMoreLink href="/my/notifications" />}>
        {inbox.data.length > 0 ? (
          <ul className="-my-1 mb-4 divide-y divide-border">
            {inbox.data.slice(0, 3).map((item) => (
              <li key={item.id} className="py-4 first:pt-0">
                <Link href={item.href || "/my/notifications"} onClick={() => markMyNotificationsRead([item.id])} className="block">
                  <p className="text-[14px] leading-6 text-foreground">
                    {!item.read ? <span className="mr-2 text-[11px] font-bold text-gold">NEW</span> : null}
                    {item.title}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{item.body} · {formatMemberDate(item.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {alerts.length === 0 && inbox.data.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-muted-foreground">아직 확인할 알림이 없어요.</p>
        ) : alerts.length === 0 ? null : (
          <ul className="-my-1 divide-y divide-border">
            {alerts.map((alert) => {
              const unread = !readIds.includes(alert.id);
              return (
                <li key={alert.id}>
                  <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                    <span className="mt-0.5 grid size-10 place-items-center rounded-md bg-background text-foreground">
                      {alert.kind === "price-drop" ? (
                        <Heart className="size-4" />
                      ) : alert.kind === "today-ship" ? (
                        <Truck className="size-4" />
                      ) : (
                        <Bell className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] leading-6 text-foreground">
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
        <div className="flex gap-6" role="tablist" aria-label="고민 중인 상품">
          {[
            { key: "wishlist" as const, label: "찜한 상품", count: wishEntries.length },
            { key: "recent" as const, label: "최근 본 상품", count: recent.length },
          ].map((tab) => {
            const selected = considerTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setConsiderTab(tab.key)}
                className={`text-[13px] transition-colors ${
                  selected
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className="ml-1 tabular-nums">{tab.count}</span>
              </button>
            );
          })}
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
                compact
                title="아직 찜한 상품이 없어요"
                action={
                  <AccountCtaLink href="/products" variant="ghost">
                    인기 상품 둘러보기
                    <ChevronRight className="size-4" strokeWidth={1.8} />
                  </AccountCtaLink>
                }
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
              compact
              title="최근 본 상품이 없어요"
              action={
                <AccountCtaLink href="/products" variant="ghost">
                  상품 둘러보기
                  <ChevronRight className="size-4" strokeWidth={1.8} />
                </AccountCtaLink>
              }
            />
          )}
        </div>
      </AccountSection>

      <SupportSection />
    </div>
  );
}
