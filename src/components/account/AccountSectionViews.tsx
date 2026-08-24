"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { brands } from "@/data/brands";
import { faqGroups } from "@/data/faq";
import { sellGuides, type MySectionKind } from "@/data/pageContent";
import { useAuthUser } from "@/hooks/useAuthUser";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { getAccountBenefits } from "@/lib/accountBenefits";
import {
  readAddresses,
  readFollowedBrandIds,
  readNotificationSettings,
  writeAddresses,
  writeFollowedBrandIds,
  writeNotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettingKey,
  type SavedAddress,
} from "@/lib/accountStorage";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { getCancelledOrders, isOrderStatus } from "@/lib/orderStatus";
import { resolveRecentlyViewedProducts } from "@/lib/recentlyViewed";
import { wishlistOwnerId } from "@/lib/wishlist";
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

export function AccountSectionViews({
  section,
  products,
}: {
  section: MySectionKind;
  products: Product[];
}) {
  if (section === "recent") {
    return <RecentView products={products} />;
  }

  if (section === "faq") {
    return <FaqView />;
  }

  if (section === "estimate") {
    return <EstimateView />;
  }

  return (
    <AuthGate>
      <SectionBody section={section} products={products} />
    </AuthGate>
  );
}

function SectionBody({
  section,
  products,
}: {
  section: MySectionKind;
  products: Product[];
}) {
  switch (section) {
    case "recent":
      return <RecentView products={products} />;
    case "orders":
      return <OrdersView />;
    case "delivery":
      return <DeliveryView />;
    case "points":
      return <PointsView />;
    case "coupons":
      return <CouponsView />;
    case "brands":
      return <BrandsView />;
    case "payments":
      return <PaymentsView />;
    case "addresses":
      return <AddressesView />;
    case "notifications":
      return <NotificationsView />;
    case "settings":
      return <SettingsView />;
    case "inquiries":
      return <InquiriesView />;
    case "returns":
      return <ReturnsView />;
    case "authentication":
      return <CareView />;
    case "grade":
      return <GradeView />;
    case "sell":
      return (
        <SellEmpty
          title="아직 판매 신청 내역이 없어요"
          description="판매 접수 API가 연결되면 여기에서 진행 상태를 확인할 수 있어요."
          href="/sell"
          action="판매 신청하기"
          steps={["접수", "수거", "검수", "판매"]}
        />
      );
    case "consignment":
      return (
        <SellEmpty
          title="진행 중인 위탁 판매가 없어요"
          description="위탁 판매를 맡기면 검수부터 정산까지 이 페이지에서 확인할 수 있어요."
          href="/sell/consignment"
          action="위탁 판매 안내 보기"
          steps={["접수", "촬영", "판매 중", "정산"]}
        />
      );
    case "inspection":
      return (
        <SellEmpty
          title="검수 진행 중인 상품이 없어요"
          description="판매 상품이 접수되면 검수 단계가 여기에 표시됩니다."
          href="/sell"
          action="판매 신청하기"
          steps={["대기", "검수 중", "완료", "보완"]}
        />
      );
    case "settlement":
      return (
        <SellEmpty
          title="정산 내역이 없어요"
          description="판매가 완료되면 정산 내역을 확인할 수 있어요."
          href="/my/estimate"
          action="내 명품 시세 확인하기"
          steps={["정산 대기", "정산 중", "완료", "보류"]}
        />
      );
    case "wishlist":
      return <WishlistView products={products} />;
    case "faq":
      return <FaqView />;
    case "estimate":
      return <EstimateView />;
    default:
      return null;
  }
}

function RecentView({ products }: { products: Product[] }) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    setItems(resolveRecentlyViewedProducts(products).map((item) => item.product));
  }, [products]);

  if (items.length === 0) {
    return (
      <AccountSection>
        <AccountEmptyState
          title="최근 본 상품이 없어요"
          description="상품 상세를 보면 이 목록에 쌓여요."
          action={<AccountCtaLink href="/new-arrivals">상품 둘러보기</AccountCtaLink>}
        />
      </AccountSection>
    );
  }

  return (
    <AccountSection>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 min-[1200px]:grid-cols-4 md:gap-6">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </AccountSection>
  );
}

function OrdersView() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status");
  const { orders, status, error, retry } = usePurchaseOrders();

  const filtered = useMemo(() => {
    if (!isOrderStatus(statusFilter)) return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  if (status === "loading") {
    return (
      <AccountSection>
        <AccountSkeleton rows={3} />
      </AccountSection>
    );
  }
  if (status === "error") {
    return (
      <AccountSection>
        <AccountErrorState message={error} onRetry={retry} />
      </AccountSection>
    );
  }
  if (orders.length === 0) {
    return (
      <AccountSection>
        <AccountEmptyState
          title="아직 주문 기록이 없어요"
          description="결제를 완료하면 주문 상태가 여기에 저장됩니다."
          action={<AccountCtaLink href="/ranking">인기 상품 보기</AccountCtaLink>}
        />
      </AccountSection>
    );
  }

  if (filtered.length === 0) {
    return (
      <AccountSection>
        <AccountEmptyState
          title="해당 상태의 주문이 없어요"
          action={<AccountCtaLink href="/my/orders" variant="ghost">필터 초기화</AccountCtaLink>}
        />
      </AccountSection>
    );
  }

  return (
    <AccountSection className="divide-y divide-border px-0 py-0 md:px-0 md:py-0">
      {filtered.map((order) => (
        <div key={order.id} id={order.id} className="px-5 md:px-6">
          <OrderCard order={order} />
        </div>
      ))}
    </AccountSection>
  );
}

function DeliveryView() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const { orders, status, error, retry } = usePurchaseOrders();
  const active = orders.filter((order) =>
    order.status === "paid" || order.status === "preparing" || order.status === "shipping"
  );
  const selected = orderId ? orders.find((order) => order.id === orderId) : active[0];

  if (status === "loading") {
    return (
      <AccountSection>
        <AccountSkeleton rows={2} />
      </AccountSection>
    );
  }
  if (status === "error") {
    return (
      <AccountSection>
        <AccountErrorState message={error} onRetry={retry} />
      </AccountSection>
    );
  }
  if (!selected) {
    return (
      <AccountSection>
        <AccountEmptyState
          title="진행 중인 배송이 없어요"
          action={<AccountCtaLink href="/my/orders">주문 내역 보기</AccountCtaLink>}
        />
      </AccountSection>
    );
  }

  return (
    <AccountSection className="divide-y divide-border px-0 py-0 md:px-0 md:py-0">
      {(orderId ? [selected] : active).map((order) => (
        <div key={order.id} className="px-5 md:px-6">
          <OrderCard order={order} emphasizeArrival />
        </div>
      ))}
    </AccountSection>
  );
}

function PointsView() {
  const benefits = getAccountBenefits();
  return (
    <div className="space-y-3">
      <AccountSection>
        <p className="text-[13px] font-medium text-muted-foreground">보유 적립금</p>
        <p className="mt-2 text-[32px] font-bold tabular-nums tracking-tight text-foreground">
          {formatPriceWithUnit(benefits.points)}
        </p>
      </AccountSection>
      <AccountSection>
        <AccountEmptyState
          title="적립 내역이 없어요"
          description="구매가 완료되면 적립 내역이 표시됩니다. 적립금 서버 API는 아직 연결되지 않았어요."
        />
      </AccountSection>
    </div>
  );
}

function CouponsView() {
  const benefits = getAccountBenefits();
  return (
    <AccountSection>
      <AccountEmptyState
        title={benefits.couponCount === 0 ? "사용 가능한 쿠폰이 없어요" : `쿠폰 ${benefits.couponCount}장`}
        description="쿠폰 서버 API가 연결되면 보유 쿠폰이 여기에 표시됩니다."
        action={<AccountCtaLink href="/ranking">상품 둘러보기</AccountCtaLink>}
      />
    </AccountSection>
  );
}

function BrandsView() {
  const { user } = useAuthUser();
  const ownerId = wishlistOwnerId(user?.uid);
  const [followed, setFollowed] = useState<string[]>([]);

  useEffect(() => {
    setFollowed(readFollowedBrandIds(ownerId));
  }, [ownerId]);

  const toggle = (id: string) => {
    const next = followed.includes(id)
      ? followed.filter((item) => item !== id)
      : [...followed, id];
    setFollowed(next);
    writeFollowedBrandIds(ownerId, next);
  };

  return (
    <div className="space-y-3">
      {followed.length === 0 ? (
        <AccountSection>
          <AccountEmptyState
            title="팔로우한 브랜드가 없어요"
            description="관심 브랜드를 저장하면 마이페이지에서 바로 볼 수 있어요."
          />
        </AccountSection>
      ) : null}
      <AccountSection>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {brands.map((brand) => {
            const active = followed.includes(brand.id);
            return (
              <li key={brand.id}>
                <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-2xl bg-secondary px-3">
                  <Link href={brand.href} className="text-sm font-semibold text-foreground">
                    {brand.name}
                  </Link>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(brand.id)}
                    className="min-h-10 rounded-md px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    {active ? "팔로우 중" : "팔로우"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </AccountSection>
    </div>
  );
}

function PaymentsView() {
  return (
    <AccountSection>
      <AccountEmptyState
        title="저장된 결제수단이 없어요"
        description="카드 정보는 저장하지 않습니다. 결제는 주문 시 토스페이먼츠에서 진행됩니다."
        action={<AccountCtaLink href="/cart">장바구니로 이동</AccountCtaLink>}
      />
    </AccountSection>
  );
}

function AddressesView() {
  const { user } = useAuthUser();
  const ownerId = wishlistOwnerId(user?.uid);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    postalCode: "",
    address1: "",
    address2: "",
  });

  useEffect(() => {
    setAddresses(readAddresses(ownerId));
  }, [ownerId]);

  const save = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address1.trim()) return;
    const next: SavedAddress = {
      id: `${Date.now()}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      postalCode: form.postalCode.trim(),
      address1: form.address1.trim(),
      address2: form.address2.trim(),
      isDefault: addresses.length === 0,
    };
    const updated = [...addresses, next];
    setAddresses(updated);
    writeAddresses(ownerId, updated);
    setOpen(false);
    setForm({ name: "", phone: "", postalCode: "", address1: "", address2: "" });
  };

  const remove = (id: string) => {
    const updated = addresses.filter((item) => item.id !== id);
    setAddresses(updated);
    writeAddresses(ownerId, updated);
  };

  return (
    <div className="space-y-3">
      <AccountSection>
        {addresses.length === 0 ? (
          <AccountEmptyState
            title="등록된 배송지가 없어요"
            description="자주 쓰는 배송지를 이 기기에 저장할 수 있어요."
          />
        ) : (
          <ul className="divide-y divide-border">
            {addresses.map((address) => (
              <li key={address.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{address.name}</p>
                    {address.isDefault ? (
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        기본
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {address.address1} {address.address2}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{address.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(address.id)}
                  className="min-h-11 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </AccountSection>

      <AccountSection>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 items-center text-sm font-semibold text-foreground"
        >
          {open ? "입력 닫기" : "배송지 추가"}
        </button>

        {open ? (
          <form
            className="mt-5 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            {(
              [
                ["name", "이름"],
                ["phone", "연락처"],
                ["postalCode", "우편번호"],
                ["address1", "주소"],
                ["address2", "상세 주소"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="grid gap-1.5 text-sm font-medium">
                {label}
                <input
                  value={form[key]}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [key]: event.target.value }))
                  }
                  className="h-12 rounded-2xl border border-border bg-secondary px-4 text-sm font-normal"
                />
              </label>
            ))}
            <button
              type="submit"
              className="h-12 rounded-md bg-foreground text-sm font-semibold text-background"
            >
              저장
            </button>
          </form>
        ) : null}
      </AccountSection>
    </div>
  );
}

function NotificationsView() {
  const { user } = useAuthUser();
  const ownerId = wishlistOwnerId(user?.uid);
  const [settings, setSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);

  useEffect(() => {
    setSettings(readNotificationSettings(ownerId));
  }, [ownerId]);

  const rows: Array<{ key: NotificationSettingKey; label: string }> = [
    { key: "order", label: "주문/배송 알림" },
    { key: "event", label: "할인/이벤트 알림" },
    { key: "price", label: "관심 상품 가격 변동 알림" },
    { key: "magazine", label: "매거진 콘텐츠 알림" },
  ];

  const toggle = (key: NotificationSettingKey) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    writeNotificationSettings(ownerId, next);
  };

  return (
    <AccountSection>
      <p className="mb-2 text-[14px] leading-6 text-muted-foreground">
        이 기기에서 받고 싶은 알림 종류를 저장합니다. 푸시 발송 서버는 아직 연결되지 않았어요.
      </p>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between py-4">
            <span className="text-[15px] font-medium text-foreground">{row.label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings[row.key]}
              onClick={() => toggle(row.key)}
              className={`flex h-8 w-12 items-center rounded-md px-1 transition-colors ${
                settings[row.key] ? "justify-end bg-foreground" : "justify-start bg-border"
              }`}
            >
              <span className="size-6 rounded-md bg-background shadow-sm" />
              <span className="sr-only">{settings[row.key] ? "켜짐" : "꺼짐"}</span>
            </button>
          </div>
        ))}
      </div>
    </AccountSection>
  );
}

function SettingsView() {
  const { user } = useAuthUser();
  const rows = [
    { label: "이름", value: user?.name || "-" },
    { label: "이메일", value: user?.email || "-" },
    { label: "휴대폰 번호", value: user?.phone || "등록된 번호가 없어요" },
    { label: "로그인 방식", value: user?.provider ?? "email" },
  ];

  return (
    <AccountSection>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 py-4 first:pt-0 last:pb-0 md:grid-cols-[160px_minmax(0,1fr)] md:items-center"
          >
            <span className="text-[14px] text-muted-foreground">{row.label}</span>
            <span className="text-[15px] font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </AccountSection>
  );
}

function InquiriesView() {
  return (
    <AccountSection>
      <AccountEmptyState
        title="아직 등록된 1:1 문의가 없어요"
        description="주문·배송·상품에 대해 궁금한 점이 있으면 문의해 주세요."
        action={<AccountCtaLink href="/notices">공지/문의 안내 보기</AccountCtaLink>}
      />
    </AccountSection>
  );
}

function ReturnsView() {
  const { orders, status, error, retry } = usePurchaseOrders();
  const cancelled = getCancelledOrders(orders);

  if (status === "loading") {
    return (
      <AccountSection>
        <AccountSkeleton rows={2} />
      </AccountSection>
    );
  }
  if (status === "error") {
    return (
      <AccountSection>
        <AccountErrorState message={error} onRetry={retry} />
      </AccountSection>
    );
  }
  if (cancelled.length === 0) {
    return (
      <AccountSection>
        <AccountEmptyState
          title="취소·교환·반품 내역이 없어요"
          action={<AccountCtaLink href="/policy/delivery">배송/반품 정책 보기</AccountCtaLink>}
        />
      </AccountSection>
    );
  }

  return (
    <AccountSection className="divide-y divide-border px-0 py-0 md:px-0 md:py-0">
      {cancelled.map((order) => (
        <div key={order.id} className="px-5 md:px-6">
          <OrderCard order={order} />
        </div>
      ))}
    </AccountSection>
  );
}

function CareView() {
  const items = [
    "구매하신 모든 상품은 LEMICHU 검수 보증 대상입니다.",
    "가품 판정 시 결제 금액의 200%를 보상해드립니다.",
    "검수 리포트는 주문 내역에서 확인하실 수 있습니다.",
  ];

  return (
    <AccountSection title="정품 보증 안내">
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-foreground/80">
            {item}
          </li>
        ))}
      </ul>
      <AccountCtaLink href="/authentication" variant="ghost">
        정품 검수 안내 보기
      </AccountCtaLink>
    </AccountSection>
  );
}

function GradeView() {
  return (
    <AccountSection>
      <AccountEmptyState
        title="회원 등급 프로그램은 준비 중이에요"
        description="등급과 혜택 수치는 서버가 연결되기 전에는 표시하지 않습니다."
      />
    </AccountSection>
  );
}

function SellEmpty({
  title,
  description,
  href,
  action,
  steps,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
  steps?: string[];
}) {
  return (
    <div className="space-y-3">
      {steps ? (
        <AccountSection>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {steps.map((step) => (
              <div key={step} className="rounded-2xl bg-secondary px-3 py-4 text-center">
                <p className="text-[22px] font-bold tabular-nums text-muted-foreground">0</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </AccountSection>
      ) : null}
      <AccountSection>
        <AccountEmptyState
          title={title}
          description={description}
          action={<AccountCtaLink href={href}>{action}</AccountCtaLink>}
        />
      </AccountSection>
    </div>
  );
}

function WishlistView({ products }: { products: Product[] }) {
  const { records } = useWishlist();
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );
  const items = records
    .map((record) => productById.get(record.productId))
    .filter((item): item is Product => Boolean(item));

  if (items.length === 0) {
    return (
      <AccountSection>
        <AccountEmptyState
          title="아직 찜한 상품이 없어요"
          description="마음에 드는 상품을 저장하면 여기에서 바로 확인할 수 있어요."
          action={<AccountCtaLink href="/ranking">인기 상품 둘러보기</AccountCtaLink>}
        />
      </AccountSection>
    );
  }

  return (
    <AccountSection>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 min-[1200px]:grid-cols-4 md:gap-6">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} variant="wishlist" />
        ))}
      </div>
    </AccountSection>
  );
}

function FaqView() {
  return (
    <div className="space-y-3">
      {faqGroups.map((group) => (
        <AccountSection key={group.category} title={group.category}>
          <div className="divide-y divide-border">
            {group.items.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="pb-4 text-[14px] leading-7 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </AccountSection>
      ))}
    </div>
  );
}

function EstimateView() {
  const guide = sellGuides.estimate;

  return (
    <div className="space-y-3">
      <AccountSection>
        <p className="text-[13px] font-medium text-muted-foreground">예상 시세</p>
        <p className="mt-2 text-[22px] font-bold tracking-tight text-foreground">{guide.doc.title}</p>
        <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{guide.doc.description}</p>
        <div className="mt-5">
          <AccountCtaLink href="/sell">판매 시작하기</AccountCtaLink>
        </div>
      </AccountSection>
      {guide.doc.sections.map((section) => (
        <AccountSection key={section.heading} title={section.heading}>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-[14px] leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </AccountSection>
      ))}
      <AccountSection>
        <Link
          href="/sell/estimate"
          className="flex min-h-12 items-center justify-between text-[15px] font-semibold text-foreground"
        >
          시세 안내 자세히 보기
          <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.8} />
        </Link>
      </AccountSection>
    </div>
  );
}
