"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuestMemberPurchaseDialog } from "@/components/product/GuestMemberPurchaseDialog";
import { ProductInquiryChat } from "@/components/product/ProductInquiryChat";
import { WishlistToggleButton } from "@/components/product/WishlistToggleButton";
import { productActionIconClassName } from "@/components/product/productActionStyles";
import { useBankTransferPurchase } from "@/components/product/useBankTransferPurchase";
import { isSoldProduct } from "@/components/product/SoldOutOverlay";
import { getPurchaseButtonLabel } from "@/lib/formatPrice";
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
  const {
    authOpen,
    closePurchase,
    continueAsGuest,
    message,
    openDeposit,
    payablePrice,
    pointsToUse,
    productHref,
    canPurchase,
    requiresVariantSelection,
  } = useBankTransferPurchase();
  const [cartMessage, setCartMessage] = useState("");
  const notice = message || cartMessage;

  return (
    <div className="fixed inset-x-0 bottom-[var(--mobile-bottom-nav-offset)] z-40 border-t border-border bg-background px-4 py-3 md:hidden">
      <div className="flex items-center gap-2">
        <WishlistToggleButton product={product} appearance="boxed" />
        <button
          type="button"
          aria-label="장바구니"
          onClick={() => setCartMessage("장바구니 페이지에서 여러 상품을 함께 결제할 수 있어요.")}
          className={productActionIconClassName}
        >
          <ShoppingBag className="size-5" strokeWidth={1.75} />
        </button>
        <ProductInquiryChat product={product} appearance="boxed" />

        {isSoldProduct(product) ? (
          <a
            href="#similar-products"
            className="inline-flex h-auto min-h-12 min-w-0 flex-1 items-center justify-center rounded-md bg-foreground px-3 py-2 text-[13px] font-semibold text-background"
          >
            비슷한 상품 보기
          </a>
        ) : (
        <Button
          variant="buy"
          size="lg"
          disabled={!canPurchase}
          onClick={openDeposit}
          className="h-auto min-h-12 min-w-0 flex-1 whitespace-normal px-2.5 py-2 text-[13px] font-semibold leading-tight"
        >
          {getPurchaseButtonLabel(
            payablePrice,
            pointsToUse > 0 ? undefined : product.retailPrice,
            {
              compact: true,
              needsOption: !canPurchase && requiresVariantSelection,
            }
          )}
        </Button>
        )}
      </div>
      {notice ? (
        <p className="mt-2 truncate text-center text-[11px] font-medium text-muted-foreground">
          {notice}
        </p>
      ) : null}
      <GuestMemberPurchaseDialog
        open={authOpen}
        onClose={closePurchase}
        onGuestPurchase={continueAsGuest}
        redirectPath={productHref}
      />
    </div>
  );
}
