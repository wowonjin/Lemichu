"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/formatPrice";
import { createProductCheckoutItem } from "@/lib/checkout";
import { readAuthUser } from "@/lib/auth";
import { requestTossPayment } from "@/lib/toss-checkout";
import type { Product } from "@/types/product";

/**
 * Mobile-only sticky purchase bar. Sits just above the bottom navigation so the
 * primary buy action is always reachable on small screens. Hidden on md+ where
 * the inline buy buttons are shown instead.
 */
export function ProductPurchaseBar({
  product,
}: {
  product: Product;
}) {
  const router = useRouter();
  const [wished, setWished] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [message, setMessage] = useState("");
  const price = product.price;
  const discountRate = product.discountRate;

  const handlePurchase = async () => {
    setMessage("");

    const user = readAuthUser();
    if (!user?.uid) {
      setMessage("로그인 후 결제할 수 있어요.");
      router.push("/login");
      return;
    }

    setIsPurchasing(true);
    try {
      await requestTossPayment([createProductCheckoutItem(product)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "결제 요청 중 문제가 발생했어요.");
      setIsPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={wished ? "찜 해제" : "찜하기"}
          aria-pressed={wished}
          onClick={() => setWished((value) => !value)}
          className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-background"
        >
          <Heart
            className={cn(
              "size-5 transition-all",
              wished ? "fill-red-500 text-red-500" : "text-foreground"
            )}
          />
        </button>

        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-[11px] text-muted-foreground">구매가</span>
          <span className="flex items-baseline gap-1">
            <span className="text-base font-semibold tabular-nums text-foreground">
              {formatPrice(price)}원
            </span>
            {discountRate ? (
              <span className="text-xs font-semibold tabular-nums text-gold">
                {discountRate}%
              </span>
            ) : null}
          </span>
        </div>

        <Button
          size="lg"
          disabled={isPurchasing}
          onClick={handlePurchase}
          className="h-12 flex-1"
        >
          {isPurchasing ? "결제 준비 중..." : "구매하기"}
        </Button>
      </div>
      {message ? (
        <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
