import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { OrderHistory } from "@/components/orders/OrderHistory";
import { ProductCard } from "@/components/product/ProductCard";
import { mySections, type MySectionKind } from "@/data/pageContent";
import { brands } from "@/data/brands";
import { getCatalogProducts } from "@/lib/catalog";
import type { Product } from "@/types/product";

type Params = Promise<{ section: string }>;

function isMySection(value: string): value is MySectionKind {
  return value in mySections;
}

export function generateStaticParams() {
  return Object.keys(mySections).map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { section } = await params;
  const meta = isMySection(section) ? mySections[section] : undefined;
  return {
    title: meta ? `${meta.title} — LEMICHU` : "마이페이지 — LEMICHU",
  };
}

export default async function MySectionPage({
  params,
}: {
  params: Params;
}) {
  const { section } = await params;

  if (!isMySection(section)) {
    notFound();
  }

  const meta = mySections[section];
  const catalogProducts = await getCatalogProducts();

  return (
    <CustomerPageShell className="bg-white bg-none font-sans">
      <section>
        <Link
          href="/my"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          마이페이지
        </Link>

        <div className="mt-5 flex flex-col gap-3 pb-2 md:flex-row md:items-end md:justify-between">
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {meta.title}
          </h1>
        </div>
        <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {meta.description}
        </p>

        <div>
          <SectionBody section={section} products={catalogProducts} />
        </div>
      </section>
    </CustomerPageShell>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="border-y border-border py-5">{children}</section>;
}

function EmptyState({ message, ctaLabel, ctaHref }: { message: string; ctaLabel?: string; ctaHref?: string }) {
  return (
    <Panel>
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        {ctaLabel && ctaHref ? (
          <Link
            href={ctaHref}
            className="inline-flex h-11 items-center justify-center bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </Panel>
  );
}

function SectionBody({ section, products }: { section: MySectionKind; products: Product[] }) {
  switch (section) {
    case "recent":
      return <ProductPanel title="최근 본 상품" products={products.slice(0, 8)} />;
    case "orders":
      return <Orders />;
    case "delivery":
      return <Delivery />;
    case "points":
      return <Points />;
    case "coupons":
      return <Coupons />;
    case "brands":
      return <BrandFollows />;
    case "payments":
      return <Payments />;
    case "addresses":
      return <Addresses />;
    case "notifications":
      return <Notifications />;
    case "grade":
      return <Grade />;
    case "settings":
      return <Settings />;
    case "inquiries":
      return <Inquiries />;
    case "returns":
      return <Returns />;
    case "authentication":
      return <CareInfo />;
    default:
      return null;
  }
}

function ProductPanel({ title, products }: { title: string; products: Product[] }) {
  return (
    <Panel>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Panel>
  );
}

const mockOrders = [
  { id: "20260628-0012", date: "2026.06.28", brand: "샤넬", name: "클래식 미디움 플랩백 캐비어", status: "배송중", price: "9,480,000원" },
  { id: "20260610-0098", date: "2026.06.10", brand: "에르메스", name: "가든파티 36 토트백", status: "구매확정", price: "4,120,000원" },
  { id: "20260522-0451", date: "2026.05.22", brand: "루이비통", name: "온더고 MM 모노그램", status: "구매확정", price: "2,980,000원" },
];

function Orders() {
  return (
    <Panel>
      <OrderHistory fallbackOrders={mockOrders} />
    </Panel>
  );
}

function Delivery() {
  const steps = ["결제완료", "상품준비", "배송중", "배송완료"];
  const current = 2;
  return (
    <Panel>
      <p className="text-sm font-semibold text-foreground">샤넬 클래식 미디움 플랩백 캐비어</p>
      <p className="mt-1 text-xs text-muted-foreground">CJ대한통운 5412-8741-9820</p>

      <div className="mt-6 flex items-center">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {index > 0 ? (
                <div className={`h-0.5 flex-1 ${index <= current ? "bg-primary" : "bg-border"}`} />
              ) : (
                <div className="flex-1" />
              )}
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index <= current ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {index + 1}
              </span>
              {index < steps.length - 1 ? (
                <div className={`h-0.5 flex-1 ${index < current ? "bg-primary" : "bg-border"}`} />
              ) : (
                <div className="flex-1" />
              )}
            </div>
            <span className="mt-2 text-[11px] font-medium text-muted-foreground">{step}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 rounded-lg bg-sand p-4 text-center text-sm font-medium text-foreground">
        오늘 오후 6시 도착 예정
      </p>
    </Panel>
  );
}

function Points() {
  const history = [
    { label: "구매 적립", date: "2026.06.10", amount: "+4,120" },
    { label: "리뷰 적립", date: "2026.06.12", amount: "+500" },
    { label: "적립금 사용", date: "2026.05.22", amount: "-2,000" },
  ];
  return (
    <div className="space-y-5">
      <Panel>
        <p className="text-sm text-muted-foreground">보유 적립금</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">12,400<span className="ml-1 text-base font-semibold text-muted-foreground">원</span></p>
      </Panel>
      <Panel>
        <h2 className="text-base font-semibold text-foreground">적립 내역</h2>
        <div className="mt-4 divide-y divide-border">
          {history.map((item) => (
            <div key={item.label + item.date} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <time className="text-xs text-muted-foreground">{item.date}</time>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${item.amount.startsWith("+") ? "text-blue-600" : "text-muted-foreground"}`}>
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Coupons() {
  const coupons = [
    { id: "c1", title: "신규 가입 10% 할인", condition: "10만원 이상 구매 시", expire: "2026.07.31까지" },
    { id: "c2", title: "검수비 무료 쿠폰", condition: "전 상품 적용", expire: "2026.08.15까지" },
    { id: "c3", title: "5만원 할인 쿠폰", condition: "100만원 이상 구매 시", expire: "2026.07.15까지" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {coupons.map((coupon) => (
        <div key={coupon.id} className="rounded-lg border border-dashed border-gold/50 bg-gold-soft/30 p-5">
          <p className="text-base font-bold text-foreground">{coupon.title}</p>
          <p className="mt-2 text-xs text-muted-foreground">{coupon.condition}</p>
          <p className="mt-4 text-xs font-medium text-gold">{coupon.expire}</p>
        </div>
      ))}
    </div>
  );
}

function BrandFollows() {
  const followed = brands.slice(0, 5);
  return (
    <Panel>
      <h2 className="text-base font-semibold text-foreground">팔로우한 브랜드</h2>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {followed.map((brand) => (
          <li key={brand.id}>
            <Link
              href={brand.href}
              className="flex h-24 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-sand transition-colors hover:border-foreground/20 hover:bg-secondary"
            >
              <span className="font-serif text-base font-semibold tracking-wide text-foreground">{brand.wordmark}</span>
              <span className="text-xs text-muted-foreground">{brand.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Payments() {
  const cards = [
    { id: "p1", name: "신한카드", number: "**** **** **** 1234", primary: true },
    { id: "p2", name: "현대카드", number: "**** **** **** 5678", primary: false },
  ];
  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <Panel key={card.id}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{card.name}</p>
                {card.primary ? (
                  <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-semibold text-foreground">기본</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm tabular-nums text-muted-foreground">{card.number}</p>
            </div>
          </div>
        </Panel>
      ))}
      <EmptyState message="새로운 결제 수단을 추가할 수 있어요." ctaLabel="결제 수단 추가" ctaHref="/my/payments" />
    </div>
  );
}

function Addresses() {
  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">레미츄</p>
              <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-semibold text-foreground">기본 배송지</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">서울특별시 강남구 테헤란로 123, 4층</p>
            <p className="mt-0.5 text-sm text-muted-foreground">010-0000-0000</p>
          </div>
        </div>
      </Panel>
      <EmptyState message="자주 사용하는 배송지를 추가해 보세요." ctaLabel="배송지 추가" ctaHref="/my/addresses" />
    </div>
  );
}

function Notifications() {
  const settings = [
    { label: "주문/배송 알림", on: true },
    { label: "할인/이벤트 알림", on: true },
    { label: "관심 상품 가격 변동 알림", on: false },
    { label: "매거진/콘텐츠 알림", on: false },
  ];
  return (
    <Panel>
      <div className="divide-y divide-border">
        {settings.map((setting) => (
          <div key={setting.label} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
            <span className="text-sm font-medium text-foreground">{setting.label}</span>
            <span className={`flex h-6 w-11 items-center rounded-full px-0.5 ${setting.on ? "justify-end bg-primary" : "justify-start bg-border"}`}>
              <span className="size-5 rounded-full bg-background shadow" />
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Grade() {
  const benefits = [
    "무료 검수 리포트 제공",
    "우선 배송 처리",
    "전용 할인 쿠폰 매월 발급",
    "신상품 우선 구매 기회",
  ];
  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gold-soft px-3 py-1 text-sm font-bold text-foreground">GOLD</span>
          <p className="text-sm text-muted-foreground">다음 등급까지 184,000원 남았어요</p>
        </div>
        <div className="mt-4 h-2 rounded-full bg-secondary">
          <div className="h-full w-3/4 rounded-full bg-primary" />
        </div>
      </Panel>
      <Panel>
        <h2 className="text-base font-semibold text-foreground">등급 혜택</h2>
        <ul className="mt-4 space-y-2.5">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Settings() {
  const rows = [
    { label: "이름", value: "레미츄" },
    { label: "이메일", value: "user@lemichu.com" },
    { label: "휴대폰 번호", value: "010-0000-0000" },
    { label: "비밀번호", value: "••••••••" },
  ];
  return (
    <Panel>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 py-4 first:pt-0 last:pb-0 md:grid-cols-[160px_minmax(0,1fr)] md:items-center">
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="text-sm font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Inquiries() {
  return (
    <EmptyState
      message="아직 등록된 1:1 문의가 없어요."
      ctaLabel="문의하기"
      ctaHref="/notices"
    />
  );
}

function Returns() {
  return (
    <EmptyState
      message="취소/교환/반품 내역이 없어요."
      ctaLabel="배송/반품 정책 보기"
      ctaHref="/policy/delivery"
    />
  );
}

function CareInfo() {
  const items = [
    "구매하신 모든 상품은 LEMICHU 검수 보증 대상입니다.",
    "가품 판정 시 결제 금액의 200%를 보상해드립니다.",
    "검수 리포트는 주문 내역에서 확인하실 수 있습니다.",
  ];
  return (
    <Panel>
      <h2 className="text-base font-semibold text-foreground">정품 보장 케어</h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-foreground/80">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/authentication"
        className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        정품 검수 안내 보기
        <ChevronRight className="size-4" />
      </Link>
    </Panel>
  );
}
