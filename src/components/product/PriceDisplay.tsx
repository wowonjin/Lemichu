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
        <span className="text-xs text-muted-foreground line-through">
          {formatPrice(retailPrice)}원
        </span>
      ) : null}

      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-semibold tabular-nums text-foreground",
            size === "lg" ? "text-xl" : "text-[15px]"
          )}
        >
          {formatPrice(price)}
          <span className="ml-0.5 text-[0.85em] font-medium">원</span>
        </span>
        {computedRate ? (
          <span className="text-sm font-semibold tabular-nums text-gold">
            {computedRate}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
