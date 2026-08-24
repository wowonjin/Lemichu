"use client";

import { useState } from "react";
import { useProductVariantPurchase } from "@/components/product/ProductVariantPurchase";
import { readAuthUser } from "@/lib/auth";
import { getVariantLabel } from "@/lib/product-variants";

type PurchaseStep = "closed" | "auth" | "deposit";

export function useBankTransferPurchase() {
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

  const openDeposit = () => {
    if (!canPurchase) {
      setMessage(
        requiresVariantSelection
          ? "구매 가능한 색상과 사이즈를 선택해주세요."
          : "현재 구매할 수 없는 상품입니다."
      );
      return;
    }

    setMessage("");
    setStep(readAuthUser()?.uid ? "deposit" : "auth");
  };

  return {
    authOpen: step === "auth",
    depositOpen: step === "deposit",
    closePurchase: () => setStep("closed"),
    continueAsGuest: () => setStep("deposit"),
    message,
    openDeposit,
    selectedPrice,
    payablePrice,
    pointsToUse,
    expectedEarn,
    usePoints,
    productId: product.id,
    variantId: selectedVariant?.id,
    productName: `${product.brand} ${product.name}`,
    productHref: product.href,
    optionLabel: selectedVariant ? getVariantLabel(selectedVariant) : undefined,
    canPurchase,
    requiresVariantSelection,
  };
}
