import { cn } from "@/lib/cn";
import { formatPrice, getDiscountRate } from "@/lib/formatPrice";

export function PriceDisplay({
  price,
  retailPrice,
  discountRate,
  className,
  size = "default",
}: {
  price: number;
  retailPrice?: number;
  discountRate?: number;
  className?: string;
  size?: "default" | "lg";
}) {
  const computedRate = discountRate ?? getDiscountRate(price, retailPrice);

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {retailPrice && retailPrice > price ? (
        <span
          className={cn(
            "text-muted-foreground line-through",
            size === "lg" ? "text-[13px]" : "text-xs"
          )}
        >
          {formatPrice(retailPrice)}원
        </span>
      ) : null}

      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "tabular-nums text-foreground",
            size === "lg"
              ? "text-[26px] font-bold leading-tight tracking-tight"
              : "text-[15px] font-semibold"
          )}
        >
          {formatPrice(price)}
          <span className="ml-0.5 text-[0.8em] font-semibold">원</span>
        </span>
        {computedRate ? (
          <span
            className={cn(
              "font-bold tabular-nums text-gold",
              size === "lg" ? "text-[16px]" : "text-sm font-semibold"
            )}
          >
            {computedRate}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
