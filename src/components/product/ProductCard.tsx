"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { CatalogImage } from "@/components/product/CatalogImage";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/formatPrice";
import type { Product } from "@/types/product";
import { PriceDisplay } from "./PriceDisplay";
import {
  AuthenticationBadge,
  ConditionBadge,
  DeliveryBadgeChip,
} from "./ProductBadge";
import { WishlistToggleButton } from "./WishlistToggleButton";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { getProductAvailability, getWishlistInsight } from "@/lib/wishlist";

export function ProductCard({
  product,
  className,
  imageClassName,
  hideAuthenticationBadge = false,
  hiddenBadges = [],
  variant = "default",
  editMode = false,
  selected = false,
  onSelect,
  onUnwish,
}: {
  product: Product;
  className?: string;
  imageClassName?: string;
  hideAuthenticationBadge?: boolean;
  hiddenBadges?: string[];
  variant?: "default" | "wishlist";
  editMode?: boolean;
  selected?: boolean;
  onSelect?: (productId: string) => void;
  onUnwish?: (product: Product) => Promise<void> | void;
}) {
  const { getRecord } = useWishlist();
  const record = getRecord(product.id);
  const availability = getProductAvailability(product);
  const insight = variant === "wishlist" ? getWishlistInsight(product, record) : null;
  const unavailable = availability !== "available";

  const imageBadges = [
    hideAuthenticationBadge ? null : (
      <AuthenticationBadge key="auth" status={product.authenticationStatus} />
    ),
    product.isPreOwned && product.condition ? (
      <ConditionBadge key="grade" condition={product.condition} />
    ) : null,
  ].filter(Boolean).slice(0, 2);

  return (
    <motion.article
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={cn("group relative flex flex-col", className)}
    >
      <Link href={product.href} className="flex flex-col gap-3">
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-[10px] border border-transparent bg-muted",
            imageClassName
          )}
        >
          <CatalogImage
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            seed={product.id}
            sizes="(min-width: 1600px) 20vw, (min-width: 1200px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="h-full w-full object-contain p-7 mix-blend-multiply dark:mix-blend-normal"
          />

          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {imageBadges}
          </div>

          {unavailable ? (
            <div className="absolute inset-0 grid place-items-center bg-background/70">
              <span className="bg-foreground px-3 py-1 text-xs font-semibold text-background">
                {availability === "sold" ? "판매 완료" : "품절"}
              </span>
            </div>
          ) : product.isPreOwned && variant !== "wishlist" ? (
            <span className="absolute bottom-2.5 left-2.5 rounded-md bg-background/85 px-2 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur">
              중고
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1 text-sm font-semibold tracking-tight text-foreground">
            {product.brand}
            {product.authenticationStatus !== "PENDING" ? (
              <ShieldCheck className="size-3.5 text-gold" />
            ) : null}
          </div>

          <p className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-tight text-muted-foreground">
            {product.name}
          </p>

          <div className="flex flex-wrap gap-1.5">
            <DeliveryBadgeChip delivery={product.deliveryBadge} />
            {variant === "default"
              ? product.badges
                  .filter((badge) => badge === "가격하락" || badge === "희소상품" || badge === "미사용급")
                  .filter((badge) => !hiddenBadges.includes(badge))
                  .map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center rounded-md border border-gold/40 bg-gold-soft/50 px-2 py-0.5 text-[11px] font-medium text-foreground"
                    >
                      {badge}
                    </span>
                  ))
              : null}
          </div>

          <PriceDisplay
            price={product.price}
            retailPrice={
              variant === "wishlist" && record && record.priceAtAdd > product.price
                ? record.priceAtAdd
                : product.retailPrice
            }
            discountRate={product.discountRate}
            className="mt-0.5"
          />

          {insight ? (
            <p
              className={cn(
                "text-xs",
                insight.kind === "price-drop" ? "font-medium text-gold" : "text-muted-foreground"
              )}
            >
              {insight.label}
            </p>
          ) : null}

        </div>
      </Link>
      {unavailable ? (
        <Link
          href={`/search?q=${encodeURIComponent(product.brand)}`}
          className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold text-foreground underline-offset-4 hover:underline"
        >
          비슷한 상품 보기
        </Link>
      ) : null}

      {editMode ? (
        <label className="absolute left-2.5 top-2.5 z-10 flex size-11 items-center justify-center bg-background/90">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.(product.id)}
            aria-label={`${product.brand} ${product.name} 선택`}
            className="size-4 accent-foreground"
          />
        </label>
      ) : null}

      <WishlistToggleButton
        product={product}
        onUnwish={onUnwish}
        className="absolute right-2.5 top-2.5 z-10"
      />

      {variant === "wishlist" && record && record.priceAtAdd > product.price ? (
        <span className="sr-only">
          이전 가격 {formatPrice(record.priceAtAdd)}원에서 {formatPrice(product.price)}원으로 하락
        </span>
      ) : null}
    </motion.article>
  );
}
