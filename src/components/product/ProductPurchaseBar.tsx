"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductInquiryChat } from "@/components/product/ProductInquiryChat";
import { WishlistToggleButton } from "@/components/product/WishlistToggleButton";
import { productActionIconClassName } from "@/components/product/productActionStyles";
import { useProductVariantPurchase } from "@/components/product/ProductVariantPurchase";
import { createProductCheckoutItem } from "@/lib/checkout";
import { getPurchaseButtonLabel } from "@/lib/formatPrice";
import { readAuthUser } from "@/lib/auth";
import { getLoginHref } from "@/lib/redirect";
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
  const {
    selectedVariant,
    selectedPrice,
    canPurchase,
    requiresVariantSelection,
  } = useProductVariantPurchase();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [message, setMessage] = useState("");

  const handlePurchase = async () => {
    setMessage("");

    if (!canPurchase) {
      setMessage(
        requiresVariantSelection
          ? "구매 가능한 옵션을 선택해주세요."
          : "현재 구매할 수 없는 상품입니다."
      );
      return;
    }

    const user = readAuthUser();
    if (!user?.uid) {
      setMessage("로그인 후 결제할 수 있어요.");
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
    <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <WishlistToggleButton product={product} appearance="boxed" />
        <button
          type="button"
          aria-label="장바구니"
          onClick={() => setMessage("장바구니 페이지에서 여러 상품을 함께 결제할 수 있어요.")}
          className={productActionIconClassName}
        >
          <ShoppingBag className="size-5" strokeWidth={1.75} />
        </button>
        <ProductInquiryChat product={product} appearance="boxed" />

        <Button
          variant="buy"
          size="lg"
          disabled={isPurchasing || !canPurchase}
          onClick={handlePurchase}
          className="h-auto min-h-12 min-w-0 flex-1 px-3 py-2 text-[13px] font-semibold leading-tight"
        >
          {getPurchaseButtonLabel(selectedPrice, product.retailPrice, {
            purchasing: isPurchasing,
            needsOption: !canPurchase && requiresVariantSelection,
          })}
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
