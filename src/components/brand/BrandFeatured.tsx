"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/home/section-motion";
import { ProductPreviewMedia } from "@/components/product/ProductPreviewMedia";
import { WishlistToggleButton } from "@/components/product/WishlistToggleButton";
import { BrandSectionHeader } from "@/components/brand/BrandSectionHeader";
import { formatPrice, getDiscountRate } from "@/lib/formatPrice";
import type { Product } from "@/types/product";

function padRank(rank: number) {
  return String(rank).padStart(2, "0");
}

function FeaturedCard({ product, rank }: { product: Product; rank: number }) {
  const rate = product.discountRate ?? getDiscountRate(product.price, product.retailPrice);

  return (
    <article className="group relative">
      <Link href={product.href} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#F7F7F7] dark:bg-muted">
          <span
            className="absolute left-3.5 top-3 z-10 text-[14px] font-bold tabular-nums tracking-tight text-foreground md:left-4 md:top-3.5 md:text-[15px]"
            aria-hidden
          >
            {padRank(rank)}
          </span>
          <span className="sr-only">{rank}위</span>
          <ProductPreviewMedia
            product={product}
            sizes="(min-width: 768px) 25vw, 50vw"
            imageClassName="object-cover mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.03] dark:mix-blend-normal"
          />
        </div>

        <div className="mt-3 min-w-0 md:mt-3.5">
          <p className="truncate text-[13px] font-semibold tracking-tight text-foreground md:text-[14px]">
            {product.brand}
          </p>
          <p className="mt-1 truncate text-[13px] leading-5 text-[#8B8B8B] dark:text-muted-foreground">
            {product.name}
          </p>
          <p className="mt-2 flex items-baseline gap-1 tabular-nums">
            {rate ? <span className="text-[13px] font-bold text-[#F04452]">{rate}%</span> : null}
            <span className="text-[14px] font-bold tracking-tight text-foreground md:text-[15px]">
              {formatPrice(product.price)}
              <span className="ml-0.5 text-[12px] font-semibold">원</span>
            </span>
          </p>
        </div>
      </Link>

      <WishlistToggleButton
        product={product}
        className="absolute right-1.5 top-1.5 z-10 size-9"
        iconClassName="size-4"
      />
    </article>
  );
}

export function BrandFeatured({
  brandName,
  products,
}: {
  brandName: string;
  products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="bg-background" aria-labelledby="brand-featured-heading">
      <div className="container min-w-0 py-8 md:py-16">
        <Reveal>
          <BrandSectionHeader
            titleId="brand-featured-heading"
            title={`지금 많이 보는 ${brandName}`}
            description="이 브랜드에서 관심이 모인 상품이에요"
          />
        </Reveal>

        <Stagger
          stagger={0.07}
          delay={0.08}
          className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:mt-8 md:grid-cols-4 md:gap-x-5"
        >
          {products.map((product, index) => (
            <StaggerItem key={product.id}>
              <FeaturedCard product={product} rank={index + 1} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
