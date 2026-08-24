"use client";

import { useProductVariantPurchase } from "@/components/product/ProductVariantPurchase";
import { cn } from "@/lib/cn";
import { formatPriceWithUnit } from "@/lib/formatPrice";

export function ProductPointsRedeem() {
  const {
    availablePoints,
    usePoints,
    toggleUsePoints,
    selectedPrice,
    pointsToUse,
    payablePrice,
    expectedEarn,
  } = useProductVariantPurchase();

  if (availablePoints <= 0) return null;

  return (
    <div className="mt-4 rounded-md border border-[#E8E8E8] bg-background px-4 py-3.5 dark:border-border">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-foreground">적립금</p>
          <p className="mt-0.5 text-[12px] text-[#8B8B8B] dark:text-muted-foreground">
            보유 {formatPriceWithUnit(availablePoints)}
          </p>
        </div>
        <button
          type="button"
          aria-pressed={usePoints}
          onClick={toggleUsePoints}
          className={cn(
            "h-9 shrink-0 rounded-md px-3 text-[12px] font-semibold transition-colors",
            usePoints
              ? "bg-foreground text-background"
              : "border border-[#E8E8E8] bg-background text-foreground hover:border-[#C8C8C8] dark:border-border"
          )}
        >
          {usePoints ? "사용 취소" : "적립금 사용하기"}
        </button>
      </div>

      {usePoints && pointsToUse > 0 ? (
        <dl className="mt-3 space-y-1.5 border-t border-[#E8E8E8] pt-3 text-[13px] dark:border-border">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#8B8B8B] dark:text-muted-foreground">상품 금액</dt>
            <dd className="font-medium tabular-nums">{formatPriceWithUnit(selectedPrice)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-medium text-[#3182F6]">적립금 사용</dt>
            <dd className="font-semibold tabular-nums text-[#3182F6]">
              -{formatPriceWithUnit(pointsToUse)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-foreground">결제 금액</dt>
            <dd className="text-[15px] font-bold tabular-nums tracking-tight text-foreground">
              {formatPriceWithUnit(payablePrice)}
            </dd>
          </div>
          {expectedEarn > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#8B8B8B] dark:text-muted-foreground">예상 적립</dt>
              <dd className="font-medium tabular-nums">{formatPriceWithUnit(expectedEarn)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}
