"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BankTransferDepositDialog } from "@/components/product/BankTransferDepositDialog";
import { GuestMemberPurchaseDialog } from "@/components/product/GuestMemberPurchaseDialog";
import { PaymentMethodPicker } from "@/components/product/PaymentMethodPicker";
import { ProductInquiryChat } from "@/components/product/ProductInquiryChat";
import { WishlistToggleButton } from "@/components/product/WishlistToggleButton";
import { productActionStackClassName } from "@/components/product/productActionStyles";
import { useBankTransferPurchase } from "@/components/product/useBankTransferPurchase";
import { getPurchaseButtonLabel } from "@/lib/formatPrice";
import type { Product } from "@/types/product";

export function ProductCheckoutActions({ product }: { product: Product }) {
  const {
    authOpen,
    depositOpen,
    closePurchase,
    continueAsGuest,
    message,
    openDeposit,
    selectedPrice,
    payablePrice,
    pointsToUse,
    expectedEarn,
    usePoints,
    productId,
    variantId,
    productName,
    productHref,
    optionLabel,
    canPurchase,
    requiresVariantSelection,
  } = useBankTransferPurchase();
  const [cartMessage, setCartMessage] = useState("");
  const notice = message || cartMessage;

  return (
    <div className="pt-4">
      <div className="grid grid-cols-3 gap-2">
        <WishlistToggleButton product={product} appearance="stack" />
        <button
          type="button"
          aria-label="장바구니"
          onClick={() => setCartMessage("장바구니 페이지에서 여러 상품을 함께 결제할 수 있어요.")}
          className={productActionStackClassName}
        >
          <ShoppingBag className="size-5" strokeWidth={1.75} />
          <span>장바구니</span>
        </button>
        <ProductInquiryChat product={product} appearance="stack" />
      </div>
      <div className="mt-3">
        <PaymentMethodPicker />
      </div>
      <Button
        variant="buy"
        size="lg"
        disabled={!canPurchase}
        onClick={openDeposit}
        className="mt-3 h-14 w-full px-4 text-[14px] font-semibold leading-tight md:text-[15px]"
      >
        {getPurchaseButtonLabel(
          payablePrice,
          pointsToUse > 0 ? undefined : product.retailPrice,
          {
            needsOption: !canPurchase && requiresVariantSelection,
          }
        )}
      </Button>
      {!canPurchase && !notice ? (
        <p className="mt-3 text-center text-xs font-medium text-[#8B8B8B] dark:text-muted-foreground">
          {requiresVariantSelection
            ? "구매할 색상과 사이즈를 선택해주세요."
            : "현재 구매할 수 없는 상품입니다."}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-3 rounded-md bg-[#F7F7F7] px-4 py-3 text-center text-xs font-medium text-foreground dark:bg-muted">
          {notice}
        </p>
      ) : null}
      <GuestMemberPurchaseDialog
        open={authOpen}
        onClose={closePurchase}
        onGuestPurchase={continueAsGuest}
        redirectPath={productHref}
      />
      <BankTransferDepositDialog
        open={depositOpen}
        onClose={closePurchase}
        amount={payablePrice}
        productAmount={selectedPrice}
        pointsToUse={pointsToUse}
        expectedEarn={expectedEarn}
        productId={productId}
        variantId={variantId}
        usePoints={usePoints}
        productName={productName}
        optionLabel={optionLabel}
      />
    </div>
  );
}
