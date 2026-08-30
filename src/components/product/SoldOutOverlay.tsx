import { cn } from "@/lib/cn";
import { getProductAvailability } from "@/lib/wishlist";
import type { Product } from "@/types/product";

export function isSoldProduct(product: Pick<Product, "availability">) {
  return getProductAvailability(product as Product) === "sold";
}

export function SoldOutOverlay({
  className,
  badgeClassName,
}: {
  className?: string;
  badgeClassName?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-[8] grid place-items-center bg-black/40",
        className
      )}
    >
      <span
        className={cn(
          "flex aspect-square size-[84px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-white text-[13px] font-semibold leading-none text-white md:size-[96px] md:text-[14px]",
          badgeClassName
        )}
      >
        <span className="flex flex-col items-center gap-0.5 text-center">
          <span>판매</span>
          <span>완료</span>
        </span>
      </span>
    </div>
  );
}

export const SOLD_OUT_NOTICE =
  "이 상품은 판매가 완료되었습니다. 비슷한 컨디션의 상품을 찾아보세요.";
