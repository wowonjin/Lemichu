"use client";

import { useProductVariantPurchase } from "@/components/product/ProductVariantPurchase";
import { cn } from "@/lib/cn";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import type { TossCheckoutMethod } from "@/lib/points";

export const SHOW_PAYMENT_METHOD_PICKER = false;

const METHODS: Array<{
  id: TossCheckoutMethod;
  label: string;
  hint: string;
  disabled?: boolean;
}> = [
  { id: "CARD", label: "카드", hint: "PG사 준비중", disabled: true },
  { id: "TRANSFER", label: "계좌이체", hint: "구매 금액의 1% 적립" },
];

export function PaymentMethodPicker({ compact = false }: { compact?: boolean }) {
  const { expectedEarn, paymentMethod, selectPaymentMethod } = useProductVariantPurchase();

  if (!SHOW_PAYMENT_METHOD_PICKER) return null;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <p className="text-[12px] font-semibold text-[#8B8B8B] dark:text-muted-foreground">
        결제수단
      </p>
      <div className="grid grid-cols-2 gap-2">
        {METHODS.map((method) => {
          const selected = !method.disabled && paymentMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              disabled={method.disabled}
              aria-pressed={selected}
              aria-disabled={method.disabled || undefined}
              onClick={() => {
                if (method.disabled) return;
                selectPaymentMethod(method.id);
              }}
              className={cn(
                "rounded-md border px-3 text-left transition-colors",
                compact ? "min-h-11 py-1.5" : "min-h-12 py-2",
                method.disabled
                  ? "cursor-not-allowed border-[#E8E8E8] bg-[#F7F7F7] text-[#B0B0B0] dark:border-border dark:bg-muted dark:text-muted-foreground"
                  : selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-[#E8E8E8] bg-background text-foreground hover:border-[#B5B5B5] dark:border-border"
              )}
            >
              <span className="block text-[13px] font-semibold">{method.label}</span>
              <span
                className={cn(
                  "mt-0.5 block text-[11px] leading-tight",
                  method.disabled
                    ? "text-[#B0B0B0] dark:text-muted-foreground"
                    : selected
                      ? "text-background/75"
                      : "text-[#8B8B8B] dark:text-muted-foreground"
                )}
              >
                {method.id === "TRANSFER" && expectedEarn > 0
                  ? `${formatPriceWithUnit(expectedEarn)} 적립`
                  : method.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
