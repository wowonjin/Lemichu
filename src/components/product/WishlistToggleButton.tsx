"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { useToast } from "@/components/ui/toast";
import {
  productActionIconClassName,
  productActionStackClassName,
  productActionWishedClassName,
} from "@/components/product/productActionStyles";
import type { Product } from "@/types/product";

export function WishlistToggleButton({
  product,
  className,
  iconClassName,
  appearance = "plain",
  onUnwish,
}: {
  product: Product;
  className?: string;
  iconClassName?: string;
  appearance?: "plain" | "boxed" | "stack";
  onUnwish?: (product: Product) => Promise<void> | void;
}) {
  const { isWished, toggle } = useWishlist();
  const { toast } = useToast();
  const wished = isWished(product.id);

  return (
    <button
      type="button"
      aria-label={wished ? "좋아요 취소" : "좋아요"}
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
        appearance === "stack" && productActionStackClassName,
        appearance === "boxed" && productActionIconClassName,
        appearance === "plain" &&
          "grid size-11 place-items-center text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        wished && appearance !== "plain" && productActionWishedClassName,
        className
      )}
    >
      <Heart
        strokeWidth={1.75}
        className={cn(
          "size-5 transition-colors",
          appearance === "plain" && "drop-shadow-sm",
          iconClassName,
          wished
            ? "fill-red-500 text-red-500"
            : appearance === "plain"
              ? "fill-white/30 text-foreground/80"
              : "fill-none text-foreground"
        )}
      />
      {appearance === "stack" ? <span>좋아요</span> : null}
    </button>
  );
}
