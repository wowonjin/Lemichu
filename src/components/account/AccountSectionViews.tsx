"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { brands } from "@/data/brands";
import { sellGuides, type MySectionKind } from "@/data/pageContent";
import {
  CouponsView,
  EstimateLinkedView,
  FaqLinkedView,
  GradeView,
  NotificationsLinkedView,
  ReturnsLinkedView,
  SellSectionView,
} from "./AccountLinkedViews";
import { fetchMyProfile, saveMyProfile } from "@/lib/member-account-client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { useAccountBenefits } from "@/hooks/useAccountBenefits";
import { formatPointLedgerDate } from "@/lib/points";
import {
  readAddresses,
  readFollowedBrandIds,
  writeAddresses,
  writeFollowedBrandIds,
  type SavedAddress,
} from "@/lib/accountStorage";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { isOrderStatus } from "@/lib/orderStatus";
import { resolveRecentlyViewedProducts } from "@/lib/recentlyViewed";
import { wishlistOwnerId } from "@/lib/wishlist";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/product/ProductCard";
import { AccountSettingsView } from "./AccountSettingsView";
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
    return <FaqLinkedView />;
  }

  if (section === "estimate") {
    return (
      <div className="space-y-3">
        <EstimateView />
        <EstimateLinkedView />
      </div>
    );
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
      return <NotificationsLinkedView />;
    case "settings":
      return <AccountSettingsView />;
    case "returns":
      return <ReturnsLinkedView />;
    case "authentication":
      return <CareView />;
    case "grade":
      return <GradeView />;
    case "sell":
      return (
        <SellSectionView
          kind="sell"
          emptyTitle="아직 판매 신청 내역이 없어요"
          emptyDescription="접수하면 관리자가 수거·검수·판매 상태를 업데이트합니다."
        />
      );
    case "consignment":
      return (
        <SellSectionView
          kind="consignment"
          emptyTitle="진행 중인 위탁 판매가 없어요"
          emptyDescription="위탁 판매를 접수하면 검수부터 정산까지 이 페이지에서 확인할 수 있어요."
        />
      );
    case "inspection":
      return (
        <SellSectionView
          kind="inspection"
          emptyTitle="검수 진행 중인 상품이 없어요"
          emptyDescription="판매 상품이 접수되면 검수 단계가 여기에 표시됩니다."
        />
      );
    case "settlement":
      return (
        <SellSectionView
          kind="settlement"
          emptyTitle="정산 내역이 없어요"
          emptyDescription="판매가 완료되면 관리자가 입력한 정산 내역을 확인할 수 있어요."
        />
      );
    case "wishlist":
      return <WishlistView products={products} />;
    case "faq":
      return <FaqLinkedView />;
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
          action={<AccountCtaLink href="/products">상품 둘러보기</AccountCtaLink>}
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
          action={<AccountCtaLink href="/products">인기 상품 보기</AccountCtaLink>}
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
  const { benefits, ledger, status, error, retry } = useAccountBenefits();

  return (
    <div className="space-y-3">
      <AccountSection>
        <p className="text-[13px] font-medium text-muted-foreground">보유 적립금</p>
        <p className="mt-2 text-[32px] font-bold tabular-nums tracking-tight text-foreground">
          {formatPriceWithUnit(benefits.points)}
        </p>
        <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
          계좌이체·무통장 입금은 실제 결제액(적립금 사용 후)의 1%가 적립됩니다. 카드 결제에는 적립금이 지급되지 않아요. 구매 확정 후 리뷰를 작성하면 텍스트 100원, 사진 포함 시 500원이 추가로 적립됩니다.
        </p>
      </AccountSection>
      <AccountSection title="적립·사용 내역">
        {status === "loading" ? <AccountSkeleton rows={2} /> : null}
        {status === "error" ? <AccountErrorState message={error} onRetry={retry} /> : null}
        {status === "ready" && ledger.length === 0 ? (
          <AccountEmptyState
            title="적립 내역이 없어요"
            description="계좌이체 구매, 적립금 사용, 리뷰 작성이 여기에 표시됩니다."
          />
        ) : null}
        {status === "ready" && ledger.length > 0 ? (
          <ul className="divide-y divide-border">
            {ledger.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="text-[14px] font-semibold text-foreground">{entry.reason}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {formatPointLedgerDate(entry)}
                    {entry.orderId ? ` · 주문 ${entry.orderId}` : ""}
                  </p>
                </div>
                <p
                  className={
                    entry.type === "spend"
                      ? "shrink-0 text-[14px] font-bold tabular-nums text-[#F04452]"
                      : "shrink-0 text-[14px] font-bold tabular-nums text-foreground"
                  }
                >
                  {entry.type === "spend" ? "-" : "+"}
                  {formatPriceWithUnit(entry.amount)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </AccountSection>
    </div>
  );
}

function BrandsView() {
  const { user } = useAuthUser();
  const ownerId = wishlistOwnerId(user?.uid);
  const [followed, setFollowed] = useState<string[]>([]);

  useEffect(() => {
    const local = readFollowedBrandIds(ownerId);
    setFollowed(local);
    fetchMyProfile()
      .then((profile) => {
        if (profile.followedBrandIds?.length) {
          setFollowed(profile.followedBrandIds);
          writeFollowedBrandIds(ownerId, profile.followedBrandIds);
        } else if (local.length) {
          saveMyProfile({ followedBrandIds: local }).catch(() => undefined);
        }
      })
      .catch(() => undefined);
  }, [ownerId]);

  const toggle = (id: string) => {
    const next = followed.includes(id)
      ? followed.filter((item) => item !== id)
      : [...followed, id];
    setFollowed(next);
    writeFollowedBrandIds(ownerId, next);
    saveMyProfile({ followedBrandIds: next }).catch(() => undefined);
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
        description="카드 정보는 저장하지 않습니다. 결제는 주문 시 카드 또는 계좌이체로 진행됩니다. 적립금은 계좌이체 결제에만 지급됩니다."
        action={<AccountCtaLink href="/my">마이페이지로 이동</AccountCtaLink>}
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

  const persist = (next: SavedAddress[]) => {
    setAddresses(next);
    writeAddresses(ownerId, next);
    saveMyProfile({ addresses: next }).catch(() => undefined);
  };

  useEffect(() => {
    const local = readAddresses(ownerId);
    setAddresses(local);
    fetchMyProfile()
      .then((profile) => {
        if (profile.addresses?.length) {
          setAddresses(profile.addresses);
          writeAddresses(ownerId, profile.addresses);
        } else if (local.length) {
          saveMyProfile({ addresses: local }).catch(() => undefined);
        }
      })
      .catch(() => undefined);
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
    persist([...addresses, next]);
    setOpen(false);
    setForm({ name: "", phone: "", postalCode: "", address1: "", address2: "" });
  };

  const remove = (id: string) => {
    persist(addresses.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-3">
      <AccountSection>
        {addresses.length === 0 ? (
          <AccountEmptyState
            title="등록된 배송지가 없어요"
            description="자주 쓰는 배송지를 저장하면 관리자 주문 처리에도 함께 보입니다."
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
          action={<AccountCtaLink href="/products">인기 상품 둘러보기</AccountCtaLink>}
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
