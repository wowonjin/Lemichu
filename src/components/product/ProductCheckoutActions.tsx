"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductInquiryChat } from "@/components/product/ProductInquiryChat";
import { WishlistToggleButton } from "@/components/product/WishlistToggleButton";
import { useProductVariantPurchase } from "@/components/product/ProductVariantPurchase";
import { createProductCheckoutItem } from "@/lib/checkout";
import { readAuthUser } from "@/lib/auth";
import { getLoginHref } from "@/lib/redirect";
import { requestTossPayment } from "@/lib/toss-checkout";
import type { Product } from "@/types/product";

export function ProductCheckoutActions({ product }: { product: Product }) {
  const router = useRouter();
  const {
    selectedVariant,
    canPurchase,
    requiresVariantSelection,
  } = useProductVariantPurchase();
  const [message, setMessage] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    setMessage("");

    if (!canPurchase) {
      setMessage(
        requiresVariantSelection
          ? "구매 가능한 색상과 사이즈를 선택해주세요."
          : "현재 구매할 수 없는 상품입니다."
      );
      return;
    }

    const user = readAuthUser();
    if (!user?.uid) {
      setMessage("토스 결제는 로그인 후 이용할 수 있어요.");
      router.push(getLoginHref(product.href));
      return;
    }

    setIsPurchasing(true);
    try {
      await requestTossPayment([createProductCheckoutItem(product, selectedVariant)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "결제 요청 중 문제가 발생했어요.");
      setIsPurchasing(false);
    }
  };

  return (
    <div className="pt-6">
      <div className="grid grid-cols-[56px_1fr] gap-2">
        <WishlistToggleButton
          product={product}
          className="h-14 w-full rounded-full border border-[#EBEBEB] bg-background transition-colors hover:bg-[#F7F7F7] dark:border-border dark:hover:bg-muted"
          iconClassName="fill-transparent"
        />
        <Button
          size="lg"
          disabled={isPurchasing || !canPurchase}
          onClick={handlePurchase}
          className="h-14 text-[15px] font-semibold hover:bg-foreground/90"
        >
          {isPurchasing ? "결제 준비 중..." : "구매하기"}
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => setMessage("장바구니 페이지에서 여러 상품을 함께 결제할 수 있어요.")}
          className="h-12 w-full border-[#EBEBEB] text-sm font-semibold hover:bg-[#F7F7F7] dark:border-border dark:hover:bg-muted"
        >
          <ShoppingBag className="size-4" />
          장바구니 담기
        </Button>
        <ProductInquiryChat product={product} />
      </div>
      {!canPurchase && !message ? (
        <p className="mt-3 text-center text-xs font-medium text-[#8B8B8B] dark:text-muted-foreground">
          {requiresVariantSelection
            ? "구매할 색상과 사이즈를 선택해주세요."
            : "현재 구매할 수 없는 상품입니다."}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-[14px] bg-[#F7F7F7] px-4 py-3 text-center text-xs font-medium text-foreground dark:bg-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
