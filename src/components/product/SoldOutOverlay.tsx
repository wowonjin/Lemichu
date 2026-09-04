import { cn } from "@/lib/cn";
import { getProductAvailability } from "@/lib/wishlist";
import type { Product } from "@/types/product";

export function isSoldProduct(product: Pick<Product, "availability">) {
  const availability = getProductAvailability(product as Product);
  return availability === "sold" || availability === "temporarily_unavailable";
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
          "grid size-[84px] shrink-0 place-items-center border border-white text-[13px] font-semibold leading-none text-white md:size-[96px] md:text-[14px]",
          badgeClassName
        )}
        style={{ borderRadius: "50%" }}
      >
        <span className="flex flex-col items-center justify-center text-center leading-tight">
          <span>판매</span>
          <span>완료</span>
        </span>
      </span>
    </div>
  );
}

export const SOLD_OUT_NOTICE =
  "이 상품은 판매가 완료되었습니다. 비슷한 컨디션의 상품을 찾아보세요.";
