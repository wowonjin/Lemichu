import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Bookmark, ChevronRight, CircleHelp, Coins, CreditCard, Gift, Headphones, Heart, Home, MapPin, Package, ReceiptText, RotateCcw, Settings, ShieldCheck, Sparkles, Star, Ticket, Truck } from "lucide-react";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getCatalogProducts } from "@/lib/catalog";
import type { Product } from "@/types/product";

export const metadata: Metadata = {
  title: "마이페이지 — LEMICHU",
};

const memberMetrics = [
  { label: "적립금", value: "12,400", unit: "원", href: "/my/points" },
  { label: "쿠폰", value: "3", unit: "장", href: "/my/coupons" },
  { label: "찜", value: "8", unit: "개", href: "/wishlist" },
];

const orderSteps = [
  { label: "결제완료", count: 1 },
  { label: "상품준비", count: 0 },
  { label: "배송중", count: 1 },
  { label: "구매확정", count: 4 },
];

const quickActions = [
  { label: "주문내역", description: "최근 6개월", href: "/my/orders", icon: ReceiptText },
  { label: "배송조회", description: "실시간 위치", href: "/my/delivery", icon: Truck },
  { label: "찜한상품", description: "8개 저장", href: "/wishlist", icon: Heart },
  { label: "관심 브랜드", description: "5개 팔로우", href: "/my/brands", icon: Bookmark },
  { label: "쿠폰함", description: "3개 사용 가능", href: "/my/coupons", icon: Ticket },
  { label: "적립금", description: "12,400원", href: "/my/points", icon: Coins },
  { label: "결제수단", description: "카드 2개", href: "/my/payments", icon: CreditCard },
  { label: "배송지 관리", description: "기본 배송지", href: "/my/addresses", icon: MapPin },
];

const benefitCards = [
  { title: "GOLD 등급", description: "무료 검수 리포트와 우선 배송 혜택을 받고 있어요.", icon: Star, href: "/my/grade" },
  { title: "쿠폰 대기중", description: "다음 달 10% 할인 쿠폰이 자동 발급돼요.", icon: Gift, href: "/my/coupons" },
  { title: "정품 보장 케어", description: "구매 상품은 LEMICHU 검수 보증 대상이에요.", icon: ShieldCheck, href: "/my/authentication" },
];

const supportLinks = [
  { label: "1:1 문의", href: "/my/inquiries", icon: Headphones },
  { label: "취소/교환/반품", href: "/my/returns", icon: RotateCcw },
  { label: "자주 묻는 질문", href: "/faq", icon: CircleHelp },
  { label: "알림 설정", href: "/my/notifications", icon: Bell },
  { label: "계정 설정", href: "/my/settings", icon: Settings },
  { label: "배송지 관리", href: "/my/addresses", icon: Home },
];

const nextDelivery = {
  brand: "샤넬",
  name: "클래식 미디움 플랩백 캐비어",
  status: "오늘 오후 6시 도착 예정",
  tracking: "CJ대한통운 5412-8741-9820",
  progress: 72,
};

const recommendations = [
  "최근 본 샤넬 백 시세가 4% 내려갔어요.",
  "관심 브랜드 에르메스 신규 검수 상품이 입고됐어요.",
  "찜한 상품 2개가 오늘 출고 가능으로 변경됐어요.",
];

export default async function MyPage() {
  const catalogProducts = await getCatalogProducts();
  const recentlyViewed = catalogProducts.slice(0, 6);
  const wished = catalogProducts.filter((product) => product.isPreOwned).slice(0, 6);

  return (
    <CustomerPageShell className="bg-white bg-none font-sans">
      <section>
        <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-end md:justify-between">
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            마이페이지
          </h2>
          <Link
            href="/my/settings"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            계정 설정
          </Link>
        </div>

        <div className="mb-6 mt-3 text-sm text-muted-foreground">
          레미츄님의 주문, 혜택, 관심 상품을 확인하세요.
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-10">
            <section>
              <SectionTitle title="회원 정보" />
              <div className="mt-4 grid grid-cols-3 border-y border-border">
                {memberMetrics.map((metric, index) => (
                  <MetricCard key={metric.label} metric={metric} bordered={index > 0} />
                ))}
              </div>
            </section>

            <section>
              <SectionTitle title="주문 현황" href="/my/orders" />
              <div className="mt-4 grid grid-cols-4 border-y border-border">
                {orderSteps.map((step, index) => (
                  <Link
                    key={step.label}
                    href="/my/orders"
                    className={`py-5 text-center transition-colors hover:bg-secondary ${
                      index > 0 ? "border-l border-border" : ""
                    }`}
                  >
                    <p className="text-2xl font-semibold tabular-nums text-foreground">
                      {step.count}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{step.label}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <SectionTitle title="바로가기" />
              <div className="mt-4 grid grid-cols-2 border-y border-border md:grid-cols-4">
                {quickActions.map((action, index) => (
                  <SimpleLinkCard
                    key={action.label}
                    href={action.href}
                    title={action.label}
                    description={action.description}
                    bordered={index % 4 !== 0}
                  />
                ))}
              </div>
            </section>

            <section>
              <SectionTitle title="최근 본 상품" href="/my/recent" />
              <div className="mt-5">
                <ProductGrid
                  products={recentlyViewed}
                  cardClassName="[&_span]:rounded-none"
                  imageClassName="rounded-none border-transparent bg-transparent"
                  hideAuthenticationBadge
                  hiddenBadges={["희소상품"]}
                />
              </div>
            </section>

            <section>
              <SectionTitle title="찜한 상품" href="/wishlist" />
              <div className="mt-5">
                <ProductGrid
                  products={wished}
                  cardClassName="[&_span]:rounded-none"
                  imageClassName="rounded-none border-transparent bg-transparent"
                  hideAuthenticationBadge
                  hiddenBadges={["희소상품"]}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-8 lg:sticky lg:top-36 lg:self-start">
            <section className="border-y border-border py-5">
              <h3 className="text-base font-semibold text-foreground">진행 중인 배송</h3>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {nextDelivery.status}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextDelivery.brand} {nextDelivery.name}
              </p>
              <Link
                href="/my/delivery"
                className="mt-4 inline-flex text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                배송 조회
              </Link>
            </section>

            <section className="border-y border-border py-5">
              <SectionTitle title="맞춤 알림" href="/my/notifications" />
              <div className="mt-4 divide-y divide-border">
                {recommendations.map((item) => (
                  <Link
                    key={item}
                    href="/my/notifications"
                    className="block py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </section>

            <section className="border-y border-border py-5">
              <SectionTitle title="고객지원 및 계정" />
              <div className="mt-4 divide-y divide-border">
                {supportLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between py-3 text-sm font-semibold text-foreground transition-colors hover:text-muted-foreground"
                  >
                    {item.label}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </CustomerPageShell>
  );
}

function MetricCard({ metric, bordered }: { metric: (typeof memberMetrics)[number]; bordered: boolean }) {
  return (
    <Link href={metric.href} className={`flex flex-col items-center justify-center gap-1 py-5 transition-colors hover:bg-secondary ${bordered ? "border-l border-border" : ""}`}>
      <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
      <span className="text-lg font-semibold tabular-nums text-foreground">
        {metric.value}
        <span className="ml-0.5 text-xs font-semibold text-muted-foreground">{metric.unit}</span>
      </span>
    </Link>
  );
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      {href ? (
        <Link href={href} className="inline-flex items-center gap-0.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          전체보기
        </Link>
      ) : null}
    </div>
  );
}

function SimpleLinkCard({
  href,
  title,
  description,
  bordered,
}: {
  href: string;
  title: string;
  description: string;
  bordered: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-5 transition-colors hover:bg-secondary ${
        bordered ? "border-l border-border" : ""
      }`}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}

function QuickAction({ action }: { action: (typeof quickActions)[number] }) {
  return (
    <Link href={action.href} className="group rounded-xl bg-secondary p-4 transition-colors hover:bg-gold-soft">
      <span className="grid size-11 place-items-center rounded-lg bg-background text-foreground shadow-sm transition-colors group-hover:bg-foreground group-hover:text-background">
        <action.icon className="size-5" strokeWidth={1.8} />
      </span>
      <p className="mt-4 text-sm font-bold text-foreground">{action.label}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{action.description}</p>
    </Link>
  );
}

function BenefitCard({ benefit }: { benefit: (typeof benefitCards)[number] }) {
  return (
    <Link href={benefit.href} className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gold-soft text-foreground">
        <benefit.icon className="size-5" strokeWidth={1.8} />
      </span>
      <span>
        <span className="block text-sm font-bold text-foreground">{benefit.title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{benefit.description}</span>
      </span>
    </Link>
  );
}

function ProductSection({ title, href, products }: { title: string; href: string; products: Product[] }) {
  return (
    <section className="mt-5 rounded-xl border border-border bg-background p-5 shadow-sm md:p-6">
      <SectionTitle title={title} href={href} />
      <div className="mt-5 flex gap-4 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-4 md:overflow-visible lg:grid-cols-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} className="w-[44vw] shrink-0 snap-start sm:w-48 md:w-auto" />
        ))}
      </div>
    </section>
  );
}
