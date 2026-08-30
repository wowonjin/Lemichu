"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ProductPreviewMedia } from "@/components/product/ProductPreviewMedia";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/formatPrice";
import type { Product } from "@/types/product";
import { PriceDisplay } from "./PriceDisplay";
import {
  ConditionBadge,
  DeliveryBadgeChip,
  OfferBadge,
  isOfferBadge,
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
    product.isPreOwned && product.condition ? (
      <ConditionBadge key="grade" condition={product.condition} />
    ) : null,
  ].filter(Boolean);
  const offerBadges =
    variant === "default"
      ? product.badges.filter(isOfferBadge).filter((badge) => !hiddenBadges.includes(badge))
      : [];
  const showDelivery = product.deliveryBadge !== "국내배송";

  return (
    <motion.article
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={cn("group relative flex flex-col", className)}
    >
      <Link href={product.href} className="flex flex-col gap-2 md:gap-3">
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden border border-transparent bg-muted",
            imageClassName
          )}
        >
          <ProductPreviewMedia
            product={product}
            sizes="(min-width: 1600px) 20vw, (min-width: 1200px) 25vw, (min-width: 768px) 33vw, 50vw"
            imageClassName="h-full w-full object-cover mix-blend-multiply dark:mix-blend-normal"
          >
            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
              {imageBadges}
            </div>

            {unavailable && availability !== "sold" ? (
              <div className="absolute inset-0 z-[8] grid place-items-center bg-background/70">
                <span className="bg-foreground px-3 py-1 text-xs font-semibold text-background">
                  품절
                </span>
              </div>
            ) : null}
          </ProductPreviewMedia>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[13px] font-semibold tracking-tight text-foreground md:text-sm">
            {product.brand}
          </div>

          <HoverMarqueeText>{product.name}</HoverMarqueeText>

          {showDelivery || offerBadges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {showDelivery ? <DeliveryBadgeChip delivery={product.deliveryBadge} /> : null}
              {offerBadges.map((badge) => (
                <OfferBadge key={badge} label={badge} />
              ))}
            </div>
          ) : null}

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
        className="absolute right-0 top-0 z-10 size-9"
        iconClassName="size-[18px]"
      />

      {variant === "wishlist" && record && record.priceAtAdd > product.price ? (
        <span className="sr-only">
          이전 가격 {formatPrice(record.priceAtAdd)}원에서 {formatPrice(product.price)}원으로 하락
        </span>
      ) : null}
    </motion.article>
  );
}

function HoverMarqueeText({ children }: { children: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const text = textRef.current;
    if (!wrap || !text) return;

    const measure = () => {
      setDistance(Math.max(0, text.scrollWidth - wrap.clientWidth));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    observer.observe(text);
    return () => observer.disconnect();
  }, [children]);

  const duration = Math.min(14, Math.max(3.5, distance / 28));

  return (
    <div ref={wrapRef} className="overflow-hidden">
      <p
        ref={textRef}
        className={cn(
          "whitespace-nowrap text-[13px] leading-tight text-muted-foreground ease-linear",
          distance > 0 && "transition-transform group-hover:[transform:translateX(var(--marquee-x))]"
        )}
        style={
          distance > 0
            ? ({
                "--marquee-x": `-${distance}px`,
                transitionDuration: `${duration}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {children}
      </p>
    </div>
  );
}
