"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { Button } from "@/components/ui/button";
import { todaysDeals, preOwnedVerified, readyToShip } from "@/data/mockProducts";
import { getPlaceholderGradient, isRealImage } from "@/lib/placeholder";
import { cn } from "@/lib/cn";
import { readAuthUser } from "@/lib/auth";
import { calculateCheckoutAmounts } from "@/lib/checkout";
import { requestTossPayment } from "@/lib/toss-checkout";
import { getLoginHref } from "@/lib/redirect";

const formatWon = (value: number) => `${value.toLocaleString("ko-KR")}원`;

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
    couponDiscount,
    shippingFee,
    finalTotal,
  } = useMemo(() => calculateCheckoutAmounts(selectedItems), [selectedItems]);
  const allSelected = items.length > 0 && selectedIds.size === items.length;

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

  const handleCheckout = async () => {
    setCheckoutMessage("");

    const user = readAuthUser();
    if (!user?.uid) {
      setCheckoutMessage("구매 기록 저장을 위해 먼저 로그인해주세요.");
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
    <CustomerPageShell className="bg-white bg-none font-sans">
      <section>
        <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-end md:justify-between">
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            장바구니
          </h2>
          <Link
            href="/new-arrivals"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            쇼핑 계속하기
          </Link>
        </div>

        <div className="mb-6 mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>총 {items.length}개 상품</span>
          <button
            type="button"
            onClick={() => {
              setItems((current) =>
                current.filter((item) => !selectedIds.has(item.product.id))
              );
              setSelectedIds(new Set());
            }}
            className="font-semibold text-foreground transition-colors hover:text-muted-foreground"
          >
            선택 삭제
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <div className="border-b border-border pb-4">
              <button
                type="button"
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <SelectionCircle selected={allSelected} />
                전체 선택 {selectedIds.size}/{items.length}
              </button>
            </div>

            <div className="divide-y divide-border">
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

            {items.length === 0 ? (
              <div className="grid min-h-52 place-items-center border border-dashed border-border text-center text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">장바구니가 비어 있어요</p>
                  <Link
                    href="/new-arrivals"
                    className="mt-2 inline-flex font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    상품 보러가기
                  </Link>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="lg:sticky lg:top-36 lg:self-start">
            <div className="border-y border-border py-5">
              <h3 className="text-base font-semibold text-foreground">
                주문 예상 금액
              </h3>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                {formatWon(finalTotal)}
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="상품 금액" value={formatWon(retailTotal)} />
                <SummaryRow
                  label="즉시 할인"
                  value={`-${formatWon(instantDiscount)}`}
                  accent
                />
                <SummaryRow
                  label="쿠폰 할인"
                  value={`-${formatWon(couponDiscount)}`}
                  accent
                />
                <SummaryRow
                  label="배송비"
                  value={shippingFee === 0 ? "무료" : formatWon(shippingFee)}
                />
                <div className="border-t border-border pt-4">
                  <SummaryRow
                    label="총 결제 예정 금액"
                    value={formatWon(finalTotal)}
                    strong
                  />
                </div>
              </div>

              <Button
                size="lg"
                disabled={selectedItems.length === 0 || isCheckingOut}
                onClick={handleCheckout}
                className="mt-6 h-14 w-full rounded-none text-base font-bold"
              >
                {isCheckingOut
                  ? "결제 준비 중..."
                  : `${selectedItems.length}개 상품 구매하기`}
              </Button>
              {checkoutMessage ? (
                <p className="mt-3 bg-secondary px-4 py-3 text-center text-xs font-medium text-foreground">
                  {checkoutMessage}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </CustomerPageShell>
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
    <article className="grid gap-4 py-5 md:grid-cols-[auto_128px_minmax(0,1fr)_auto] md:items-center">
      <button
        type="button"
        onClick={onToggle}
        aria-label={`${product.brand} 선택`}
        className="hidden md:block"
      >
        <SelectionCircle selected={selected} />
      </button>

      <div className="flex gap-4 md:contents">
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${product.brand} 선택`}
          className="mt-1 md:hidden"
        >
          <SelectionCircle selected={selected} />
        </button>

        <Link
          href={product.href}
          className="relative size-28 shrink-0 overflow-hidden border border-transparent bg-transparent md:size-32"
        >
          {isRealImage(product.imageUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={`${product.brand} ${product.name}`}
              className="h-full w-full object-contain p-3 mix-blend-multiply"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ backgroundImage: getPlaceholderGradient(product.id) }}
            />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
              {product.deliveryBadge}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {item.store}
            </span>
          </div>
          <Link href={product.href} className="mt-2 block">
            <p className="text-sm font-bold text-foreground">{product.brand}</p>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {product.name}
            </p>
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">{item.option}</p>
          <p className="mt-1 text-xs font-semibold text-gold">
            {item.expectedArrival}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 md:hidden">
            <QuantityControl quantity={item.quantity} onChange={onQuantityChange} />
            <p className="text-base font-bold text-foreground">
              {formatWon(product.price * item.quantity)}
            </p>
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-5 md:flex">
        <QuantityControl quantity={item.quantity} onChange={onQuantityChange} />
      </div>

      <div className="hidden min-w-36 text-right md:block">
        <p className="text-lg font-bold text-foreground">
          {formatWon(product.price * item.quantity)}
        </p>
        {product.retailPrice ? (
          <p className="mt-1 text-xs text-muted-foreground line-through">
            {formatWon(product.retailPrice * item.quantity)}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Trash2 className="size-3.5" />
          삭제
        </button>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="flex items-center justify-center gap-1 border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
      >
        <Trash2 className="size-3.5" />
        삭제
      </button>
    </article>
  );
}

function SelectionCircle({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "grid size-6 place-items-center rounded-full border transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-transparent"
      )}
    >
      <Check className="size-4" strokeWidth={3} />
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
    <div className="inline-flex h-10 items-center overflow-hidden border border-border bg-background">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={quantity <= 1}
        aria-label="수량 줄이기"
        className="grid size-10 place-items-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center text-sm font-bold tabular-nums text-foreground">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-label="수량 늘리기"
        className="grid size-10 place-items-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
  strong,
}: {
  label: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        strong && "text-base font-bold"
      )}
    >
      <span className={strong ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
      <span
        className={cn(
          "font-semibold tabular-nums text-foreground",
          accent && "text-gold",
          strong && "text-xl"
        )}
      >
        {value}
      </span>
    </div>
  );
}
