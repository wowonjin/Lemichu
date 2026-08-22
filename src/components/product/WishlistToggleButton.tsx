"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { useToast } from "@/components/ui/toast";
import type { Product } from "@/types/product";

export function WishlistToggleButton({
  product,
  className,
  iconClassName,
  onUnwish,
}: {
  product: Product;
  className?: string;
  iconClassName?: string;
  onUnwish?: (product: Product) => Promise<void> | void;
}) {
  const { isWished, toggle } = useWishlist();
  const { toast } = useToast();
  const wished = isWished(product.id);

  return (
    <button
      type="button"
      aria-label={wished ? "찜 해제" : "찜하기"}
      aria-pressed={wished}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();

        try {
          if (wished && onUnwish) {
            await onUnwish(product);
            return;
          }

          await toggle(product);
        } catch {
          toast("찜 상태를 저장하지 못했어요. 다시 시도해 주세요.");
        }
      }}
      className={cn(
        "grid size-11 place-items-center text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        className
      )}
    >
      <Heart
        className={cn(
          "size-5 transition-all drop-shadow-sm",
          wished ? "fill-red-500 text-red-500" : "fill-white/30 text-foreground/80",
          iconClassName
        )}
      />
    </button>
  );
}
