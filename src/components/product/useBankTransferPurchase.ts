"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProductVariantPurchase } from "@/components/product/ProductVariantPurchase";
import { canSubmitMemberOrder, readAuthUser } from "@/lib/auth";
import { saveCheckoutDraft } from "@/lib/checkout-draft";
import { getVariantLabel } from "@/lib/product-variants";

type PurchaseStep = "closed" | "auth";

export function useBankTransferPurchase() {
  const router = useRouter();
  const {
    selectedVariant,
    selectedPrice,
    payablePrice,
    pointsToUse,
    expectedEarn,
    usePoints,
    canPurchase,
    requiresVariantSelection,
    product,
  } = useProductVariantPurchase();
  const [step, setStep] = useState<PurchaseStep>("closed");
  const [message, setMessage] = useState("");

  const goToCheckout = (mode: "guest" | "member" = "member") => {
    if (!canPurchase) {
      setMessage(
        requiresVariantSelection
          ? "구매 가능한 색상과 사이즈를 선택해주세요."
          : "현재 구매할 수 없는 상품입니다."
      );
      return;
    }

    const isMember = mode === "member" && canSubmitMemberOrder(readAuthUser());
    saveCheckoutDraft({
      items: [
        {
          productId: product.id,
          variantId: selectedVariant?.id,
          brand: product.brand,
          name: product.name,
          imageUrl: product.imageUrl,
          href: product.href,
          optionLabel: selectedVariant ? getVariantLabel(selectedVariant) : undefined,
          unitPrice: selectedPrice,
          retailPrice: product.retailPrice,
          quantity: 1,
        },
      ],
      mode: isMember ? "member" : "guest",
      usePoints: isMember ? usePoints : false,
      pointsToUse: isMember ? pointsToUse : 0,
      expectedEarn,
    });
    setStep("closed");
    router.push("/checkout");
  };

  const openDeposit = () => {
    if (!canPurchase) {
      goToCheckout("guest");
      return;
    }

    setMessage("");
    if (canSubmitMemberOrder(readAuthUser())) {
      goToCheckout("member");
      return;
    }
    // No Firebase session → go straight to guest checkout (no login required).
    goToCheckout("guest");
  };

  const continueAsGuest = () => {
    if (!canPurchase) {
      setMessage(
        requiresVariantSelection
          ? "구매 가능한 색상과 사이즈를 선택해주세요."
          : "현재 구매할 수 없는 상품입니다."
      );
      return;
    }

    saveCheckoutDraft({
      items: [
        {
          productId: product.id,
          variantId: selectedVariant?.id,
          brand: product.brand,
          name: product.name,
          imageUrl: product.imageUrl,
          href: product.href,
          optionLabel: selectedVariant ? getVariantLabel(selectedVariant) : undefined,
          unitPrice: selectedPrice,
          retailPrice: product.retailPrice,
          quantity: 1,
        },
      ],
      mode: "guest",
      usePoints: false,
      pointsToUse: 0,
      expectedEarn,
    });
    setStep("closed");
    router.push("/checkout");
  };

  return {
    authOpen: step === "auth",
    closePurchase: () => setStep("closed"),
    continueAsGuest,
    message,
    openDeposit,
    payablePrice,
    pointsToUse,
    productHref: product.href,
    canPurchase,
    requiresVariantSelection,
  };
}
