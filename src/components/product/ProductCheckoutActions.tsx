"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistToggleButton } from "@/components/product/WishlistToggleButton";
import { createProductCheckoutItem } from "@/lib/checkout";
import { readAuthUser } from "@/lib/auth";
import { getLoginHref } from "@/lib/redirect";
import { requestTossPayment } from "@/lib/toss-checkout";
import type { Product } from "@/types/product";

export function ProductCheckoutActions({ product }: { product: Product }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    setMessage("");

    const user = readAuthUser();
    if (!user?.uid) {
      setMessage("토스 결제는 로그인 후 이용할 수 있어요.");
      router.push(getLoginHref(product.href));
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
    <div className="pt-5">
      <div className="grid grid-cols-[56px_1fr] gap-2">
        <WishlistToggleButton
          product={product}
          className="h-14 w-full border border-border bg-background hover:bg-secondary"
          iconClassName="fill-transparent"
        />
        <Button
          size="lg"
          disabled={isPurchasing}
          onClick={handlePurchase}
          className="h-14 rounded-none text-base"
        >
          {isPurchasing ? "결제 준비 중..." : "구매하기"}
        </Button>
      </div>
      <Button
        size="lg"
        variant="outline"
        onClick={() => setMessage("장바구니 페이지에서 여러 상품을 함께 결제할 수 있어요.")}
        className="mt-2 h-14 w-full rounded-none text-base"
      >
        <ShoppingBag className="size-4" />
        장바구니 담기
      </Button>
      {message ? (
        <p className="mt-3 bg-secondary px-4 py-3 text-center text-xs font-medium text-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
