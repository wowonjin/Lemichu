"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { getPlaceholderGradient, isRealImage } from "@/lib/placeholder";
import type { Product } from "@/types/product";
import { PriceDisplay } from "./PriceDisplay";
import {
  AuthenticationBadge,
  ConditionBadge,
  DeliveryBadgeChip,
} from "./ProductBadge";

export function ProductCard({
  product,
  className,
  imageClassName,
  hideAuthenticationBadge = false,
  hiddenBadges = [],
}: {
  product: Product;
  className?: string;
  imageClassName?: string;
  hideAuthenticationBadge?: boolean;
  hiddenBadges?: string[];
}) {
  const [wished, setWished] = useState(false);
  const showImage = isRealImage(product.imageUrl);

  return (
    <motion.article
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={cn("group relative flex flex-col", className)}
    >
      <Link href={product.href} className="flex flex-col gap-3">
        {/* Image (4:5) */}
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-[10px] border border-transparent bg-[#f6f7f8]",
            imageClassName
          )}
        >
          {showImage ? (
            <Image
              src={product.imageUrl}
              alt={`${product.brand} ${product.name}`}
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 768px) 25vw, 50vw"
              className="h-full w-full object-contain p-5 mix-blend-multiply"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ backgroundImage: getPlaceholderGradient(product.id) }}
              aria-hidden
            />
          )}

          {/* top-left trust overlay */}
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {hideAuthenticationBadge ? null : (
              <AuthenticationBadge status={product.authenticationStatus} />
            )}
            {product.isPreOwned && product.condition ? (
              <ConditionBadge condition={product.condition} />
            ) : null}
          </div>

          {product.isPreOwned ? (
            <span className="absolute bottom-2.5 left-2.5 rounded-md bg-background/85 px-2 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur">
              중고
            </span>
          ) : null}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2">
          {/* 1. brand */}
          <div className="flex items-center gap-1 text-sm font-semibold tracking-tight text-foreground">
            {product.brand}
            {product.authenticationStatus !== "PENDING" ? (
              <ShieldCheck className="size-3.5 text-gold" />
            ) : null}
          </div>

          {/* 2. name */}
          <p className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-tight text-muted-foreground">
            {product.name}
          </p>

          {/* 3-5. delivery + extra trust signals */}
          <div className="flex flex-wrap gap-1.5">
            <DeliveryBadgeChip delivery={product.deliveryBadge} />
            {product.badges
              .filter((b) => b === "가격하락" || b === "희소상품" || b === "미사용급")
              .filter((b) => !hiddenBadges.includes(b))
              .map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center rounded-md border border-gold/40 bg-gold-soft/50 px-2 py-0.5 text-[11px] font-medium text-foreground"
                >
                  {b}
                </span>
              ))}
          </div>

          {/* 6-7. price (discount kept subordinate) */}
          <PriceDisplay
            price={product.price}
            retailPrice={product.retailPrice}
            discountRate={product.discountRate}
            className="mt-0.5"
          />
        </div>
      </Link>

      {/* wishlist */}
      <button
        type="button"
        aria-label={wished ? "찜 해제" : "찜하기"}
        aria-pressed={wished}
        onClick={() => setWished((v) => !v)}
        className="absolute right-2.5 top-2.5 grid size-8 place-items-center"
      >
        <Heart
          className={cn(
            "size-5 transition-all drop-shadow-sm",
            wished ? "fill-red-500 text-red-500" : "fill-white/30 text-foreground/80"
          )}
        />
      </button>
    </motion.article>
  );
}
