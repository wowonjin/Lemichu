"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { todaysDeals, preOwnedVerified, readyToShip } from "@/data/mockProducts";
import { getPlaceholderGradient, isRealImage } from "@/lib/placeholder";
import { cn } from "@/lib/cn";
import { readAuthUser } from "@/lib/auth";
import { calculateCheckoutAmounts } from "@/lib/checkout";
import { requestTossPayment } from "@/lib/toss-checkout";
import { getLoginHref } from "@/lib/redirect";

const formatWon = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const FREE_SHIPPING_THRESHOLD = 500_000;

const initialCartItems = [
  {
    product: todaysDeals[0],
    quantity: 1,
    option: "블랙 / 미디움",
    expectedArrival: "6월 30일 도착 예정",
    store: "LEMICHU 검수센터",
  },
  {
    product: preOwnedVerified[3],
    quantity: 1,
    option: "탄 / 미디움 / S급",
    expectedArrival: "7월 1일 도착 예정",
    store: "프리오운드 셀렉션",
  },
  {
    product: readyToShip[2],
    quantity: 2,
    option: "베이지/에보니 / 미니",
    expectedArrival: "오늘 출고 가능",
    store: "브랜드 공식 파트너",
  },
];

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState(initialCartItems);
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(initialCartItems.map((item) => item.product.id))
  );
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.product.id)),
    [items, selectedIds]
  );

  const {
    retailTotal,
    productTotal,
    instantDiscount,
    shippingFee,
    finalTotal,
  } = useMemo(() => calculateCheckoutAmounts(selectedItems), [selectedItems]);

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const canCheckout = selectedItems.length > 0 && !isCheckingOut;
  const shippingRemain = Math.max(FREE_SHIPPING_THRESHOLD - productTotal, 0);
  const suggestions = useMemo(() => {
    const seen = new Set(items.map((item) => item.product.id));
    const next = [];

    for (const product of [...todaysDeals, ...readyToShip, ...preOwnedVerified]) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      next.push(product);
      if (next.length === 4) break;
    }

    return next;
  }, [items]);

  const toggleAll = () => {
    setSelectedIds(
      allSelected ? new Set() : new Set(items.map((item) => item.product.id))
    );
  };

  const toggleItem = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateQuantity = (id: string, nextQuantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.product.id === id
          ? { ...item, quantity: Math.max(1, nextQuantity) }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.product.id !== id));
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const removeSelected = () => {
    setItems((current) =>
      current.filter((item) => !selectedIds.has(item.product.id))
    );
    setSelectedIds(new Set());
  };

  const handleCheckout = async () => {
    setCheckoutMessage("");

    const user = readAuthUser();
    if (!user?.uid) {
      setCheckoutMessage("결제를 위해 먼저 로그인해주세요.");
      router.push(getLoginHref("/cart"));
      return;
    }

    setIsCheckingOut(true);

    try {
      await requestTossPayment(
        selectedItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          option: item.option,
          expectedArrival: item.expectedArrival,
          store: item.store,
        }))
      );
    } catch (error) {
      setCheckoutMessage(
        error instanceof Error ? error.message : "결제 요청 중 문제가 발생했어요."
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="bg-[#F5F5F7] font-sans text-[#1D1D1F] dark:bg-black dark:text-[#F5F5F7]">
      <div className="mx-auto max-w-[1040px] px-5 pb-36 pt-10 md:px-8 md:pb-24 md:pt-16">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] md:text-[56px]">
              장바구니.
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-[#6E6E73] md:text-[19px] dark:text-[#A1A1A6]">
              {items.length === 0
                ? "담아둔 상품이 없습니다. 검수 완료 상품을 둘러보세요."
                : `${items.length}개의 상품이 담겨 있습니다. 무료 배송 및 정품 검수.`}
            </p>
          </div>

          {items.length > 0 ? (
            <div className="hidden min-w-[240px] text-right md:block">
              <p className="text-[13px] text-[#6E6E73] dark:text-[#A1A1A6]">
                {selectedItems.length}개 선택 소계
              </p>
              <p className="mt-1 text-[28px] font-semibold tracking-[-0.03em] tabular-nums">
                {formatWon(finalTotal)}
              </p>
              <CheckoutButton
                className="mt-4 w-full"
                disabled={!canCheckout}
                loading={isCheckingOut}
                count={selectedItems.length}
                onClick={handleCheckout}
              />
            </div>
          ) : null}
        </header>

        {items.length > 0 ? (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex items-center gap-2 text-[#1D1D1F] transition-colors hover:text-[#0071E3] dark:text-[#F5F5F7]"
            >
              <SelectionCircle selected={allSelected} />
              전체 선택
              <span className="text-[#6E6E73] dark:text-[#A1A1A6]">
                {selectedIds.size}/{items.length}
              </span>
            </button>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={removeSelected}
                disabled={selectedIds.size === 0}
                className="text-[#6E6E73] transition-colors hover:text-[#1D1D1F] disabled:opacity-40 dark:hover:text-white"
              >
                선택 항목 삭제
              </button>
              <Link
                href="/new-arrivals"
                className="font-medium text-[#0071E3] transition-colors hover:text-[#0077ED]"
              >
                쇼핑 계속하기
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <Link
              href="/new-arrivals"
              className="text-[17px] font-medium text-[#0071E3] transition-colors hover:text-[#0077ED]"
            >
              쇼핑 계속하기
            </Link>
          </div>
        )}

        {items.length > 0 && productTotal > 0 ? (
          <div className="mt-6 rounded-[22px] bg-white px-5 py-4 dark:bg-[#1C1C1E]">
            {shippingFee === 0 ? (
              <p className="text-[14px] text-[#068441]">
                이 주문은 무료 배송이 적용됩니다.
              </p>
            ) : (
              <div>
                <p className="text-[14px] text-[#6E6E73] dark:text-[#A1A1A6]">
                  <span className="font-medium text-[#1D1D1F] dark:text-white">
                    {formatWon(shippingRemain)}
                  </span>{" "}
                  더 담으면 무료 배송입니다.
                </p>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[#E8E8ED] dark:bg-[#3A3A3C]">
                  <div
                    className="h-full rounded-full bg-[#0071E3] transition-[width] duration-300"
                    style={{
                      width: `${Math.min((productTotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}

        {items.length === 0 ? (
          <section className="mt-8 rounded-[28px] bg-white px-6 py-20 text-center dark:bg-[#1C1C1E]">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E]">
              <ShoppingBag className="size-7 text-[#6E6E73]" strokeWidth={1.5} />
            </span>
            <h2 className="mt-6 text-[28px] font-semibold tracking-[-0.03em]">
              장바구니가 비어 있습니다.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#6E6E73] dark:text-[#A1A1A6]">
              정품 검수가 끝난 신상과 프리오운드를 담고, 한 번의 결제로 받아보세요.
            </p>
            <Link
              href="/new-arrivals"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#0071E3] px-7 text-[17px] text-white transition-colors hover:bg-[#0077ED]"
            >
              상품 보러가기
            </Link>
          </section>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <section className="overflow-hidden rounded-[28px] bg-white dark:bg-[#1C1C1E]">
              <div className="divide-y divide-[#D2D2D7]/70 dark:divide-[#424245]">
                {items.map((item) => (
                  <CartItemRow
                    key={item.product.id}
                    item={item}
                    selected={selectedIds.has(item.product.id)}
                    onToggle={() => toggleItem(item.product.id)}
                    onQuantityChange={(quantity) =>
                      updateQuantity(item.product.id, quantity)
                    }
                    onRemove={() => removeItem(item.product.id)}
                  />
                ))}
              </div>
            </section>

            <aside className="lg:sticky lg:top-44 lg:self-start">
              <div className="rounded-[28px] bg-white p-6 md:p-7 dark:bg-[#1C1C1E]">
                <h2 className="text-[21px] font-semibold tracking-[-0.02em]">
                  주문 요약
                </h2>
                <p className="mt-1 text-[13px] text-[#6E6E73] dark:text-[#A1A1A6]">
                  선택한 {selectedItems.length}개 상품 기준
                </p>

                <div className="mt-6 space-y-3.5 text-[15px]">
                  <SummaryRow label="상품 금액" value={formatWon(retailTotal)} />
                  <SummaryRow
                    label="즉시 할인"
                    value={`-${formatWon(instantDiscount)}`}
                    accent
                  />
                  <SummaryRow
                    label="배송"
                    value={shippingFee === 0 ? "무료" : formatWon(shippingFee)}
                  />
                </div>

                <div className="mt-5 border-t border-[#D2D2D7]/70 pt-5 dark:border-[#424245]">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-[15px] font-medium">총계</span>
                    <span className="text-[28px] font-semibold tracking-[-0.03em] tabular-nums">
                      {formatWon(finalTotal)}
                    </span>
                  </div>
                </div>

                <CheckoutButton
                  className="mt-6 w-full"
                  disabled={!canCheckout}
                  loading={isCheckingOut}
                  count={selectedItems.length}
                  onClick={handleCheckout}
                />

                <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-[#6E6E73] dark:text-[#A1A1A6]">
                  <Lock className="size-3.5" strokeWidth={1.8} />
                  안전한 결제 · 구매 후 검수 이력 제공
                </p>

                {checkoutMessage ? (
                  <p className="mt-4 rounded-2xl bg-[#F5F5F7] px-4 py-3 text-center text-[13px] leading-relaxed text-[#1D1D1F] dark:bg-[#2C2C2E] dark:text-[#F5F5F7]">
                    {checkoutMessage}
                  </p>
                ) : null}
              </div>
            </aside>
          </div>
        )}

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <TrustCard
            icon={ShieldCheck}
            title="정품 검수"
            description="전문 검수팀이 진위와 상태를 확인한 뒤에만 출고합니다."
          />
          <TrustCard
            icon={Truck}
            title="안심 배송"
            description="50만원 이상 무료 배송. 파손 방지 포장으로 보냅니다."
          />
          <TrustCard
            icon={RotateCcw}
            title="교환 · 반품"
            description="미사용 상품은 수령 후 7일 이내 접수할 수 있습니다."
          />
        </section>

        {suggestions.length > 0 ? (
          <section className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-[28px] font-semibold tracking-[-0.03em] md:text-[32px]">
                함께 보면 좋은 상품.
              </h2>
              <Link
                href="/new-arrivals"
                className="shrink-0 text-[14px] font-medium text-[#0071E3] hover:text-[#0077ED]"
              >
                더 보기
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {suggestions.map((product) => (
                <Link
                  key={product.id}
                  href={product.href}
                  className="group overflow-hidden rounded-[24px] bg-white p-4 transition-transform duration-300 hover:-translate-y-0.5 dark:bg-[#1C1C1E]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-[18px] bg-[#F5F5F7] dark:bg-[#2C2C2E]">
                    {isRealImage(product.imageUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={`${product.brand} ${product.name}`}
                        className="h-full w-full object-contain p-5 mix-blend-multiply dark:mix-blend-normal"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ backgroundImage: getPlaceholderGradient(product.id) }}
                      />
                    )}
                  </div>
                  <p className="mt-3 text-[12px] text-[#6E6E73] dark:text-[#A1A1A6]">
                    {product.brand}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug tracking-[-0.01em]">
                    {product.name}
                  </p>
                  <p className="mt-2 text-[14px] tabular-nums">{formatWon(product.price)}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <p className="mt-14 text-center text-[13px] text-[#6E6E73] dark:text-[#A1A1A6]">
          도움이 필요하신가요?{" "}
          <Link href="/faq" className="text-[#0071E3] hover:text-[#0077ED]">
            고객센터
          </Link>
          에서 주문과 배송을 안내합니다.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-black/5 bg-white/90 px-5 py-3 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-[#1C1C1E]/90">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                {selectedItems.length}개 선택
              </p>
              <p className="text-[18px] font-semibold tracking-[-0.02em] tabular-nums">
                {formatWon(finalTotal)}
              </p>
            </div>
            <CheckoutButton
              className="min-w-[148px]"
              disabled={!canCheckout}
              loading={isCheckingOut}
              count={selectedItems.length}
              onClick={handleCheckout}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CartItemRow({
  item,
  selected,
  onToggle,
  onQuantityChange,
  onRemove,
}: {
  item: (typeof initialCartItems)[number];
  selected: boolean;
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { product } = item;

  return (
    <article className="grid gap-5 px-5 py-7 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start md:gap-7 md:px-8 md:py-10">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${product.brand} 선택`}
          className="mt-2 shrink-0"
        >
          <SelectionCircle selected={selected} />
        </button>
        <Link
          href={product.href}
          className="relative size-[108px] shrink-0 overflow-hidden rounded-[22px] bg-[#F5F5F7] md:size-[148px] dark:bg-[#2C2C2E]"
        >
          {isRealImage(product.imageUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={`${product.brand} ${product.name}`}
              className="h-full w-full object-contain p-4 mix-blend-multiply md:p-5 dark:mix-blend-normal"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ backgroundImage: getPlaceholderGradient(product.id) }}
            />
          )}
        </Link>
      </div>

      <div className="min-w-0">
        <p className="text-[13px] text-[#6E6E73] dark:text-[#A1A1A6]">{product.brand}</p>
        <Link href={product.href} className="mt-1 block">
          <h3 className="text-[19px] font-semibold leading-snug tracking-[-0.02em] md:text-[21px]">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 text-[14px] text-[#6E6E73] dark:text-[#A1A1A6]">{item.option}</p>
        <p className="mt-1 text-[13px] text-[#6E6E73] dark:text-[#A1A1A6]">{item.store}</p>
        <p className="mt-3 text-[14px] font-medium text-[#068441]">{item.expectedArrival}</p>
        <p className="mt-1 text-[12px] text-[#6E6E73] dark:text-[#A1A1A6]">
          {product.deliveryBadge} · 정품 검수 완료
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <QuantityControl quantity={item.quantity} onChange={onQuantityChange} />
          <button
            type="button"
            onClick={onRemove}
            className="text-[14px] text-[#0071E3] transition-colors hover:text-[#0077ED]"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="text-left md:min-w-[140px] md:text-right">
        <p className="text-[19px] font-semibold tracking-[-0.02em] tabular-nums md:text-[21px]">
          {formatWon(product.price * item.quantity)}
        </p>
        {product.retailPrice ? (
          <p className="mt-1 text-[13px] text-[#6E6E73] line-through tabular-nums dark:text-[#A1A1A6]">
            {formatWon(product.retailPrice * item.quantity)}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function SelectionCircle({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "grid size-[22px] place-items-center rounded-full border transition-colors",
        selected
          ? "border-[#0071E3] bg-[#0071E3] text-white"
          : "border-[#D2D2D7] bg-white text-transparent dark:border-[#636366] dark:bg-transparent"
      )}
    >
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  );
}

function QuantityControl({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <div className="inline-flex h-9 items-center rounded-full bg-[#F5F5F7] px-1 dark:bg-[#2C2C2E]">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={quantity <= 1}
        aria-label="수량 줄이기"
        className="grid size-7 place-items-center rounded-full text-[#1D1D1F] transition-colors hover:bg-white disabled:opacity-30 dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C]"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-7 text-center text-[14px] font-medium tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-label="수량 늘리기"
        className="grid size-7 place-items-center rounded-full text-[#1D1D1F] transition-colors hover:bg-white dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C]"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#6E6E73] dark:text-[#A1A1A6]">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          accent ? "text-[#068441]" : "text-[#1D1D1F] dark:text-[#F5F5F7]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function CheckoutButton({
  className,
  disabled,
  loading,
  count,
  onClick,
}: {
  className?: string;
  disabled: boolean;
  loading: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-full bg-[#0071E3] px-6 text-[17px] text-white transition-colors hover:bg-[#0077ED] active:bg-[#006EDB] disabled:pointer-events-none disabled:bg-[#0071E3]/35",
        className
      )}
    >
      {loading ? "결제 준비 중..." : count > 0 ? "결제하기" : "상품을 선택하세요"}
    </button>
  );
}

function TrustCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[22px] bg-white px-5 py-5 dark:bg-[#1C1C1E]">
      <Icon className="size-5 text-[#0071E3]" strokeWidth={1.7} />
      <p className="mt-3 text-[15px] font-semibold tracking-[-0.01em]">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#6E6E73] dark:text-[#A1A1A6]">
        {description}
      </p>
    </div>
  );
}
