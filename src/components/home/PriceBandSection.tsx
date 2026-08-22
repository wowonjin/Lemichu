"use client";

import { useId, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatPrice, getDiscountRate } from "@/lib/formatPrice";
import { getPlaceholderGradient, isRealImage } from "@/lib/placeholder";
import type { HomeTabProducts } from "@/lib/homeCatalog";
import type { Product } from "@/types/product";

function PriceBandCard({ product }: { product: Product }) {
  const rate = product.discountRate ?? getDiscountRate(product.price, product.retailPrice);

  return (
    <Link href={product.href} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-[16px] bg-[#F7F7F7] dark:bg-muted">
        {isRealImage(product.imageUrl) ? (
          <Image
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-contain p-6 mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.03] dark:mix-blend-normal md:p-7"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ backgroundImage: getPlaceholderGradient(product.id) }}
            aria-hidden
          />
        )}
      </div>

      <div className="mt-3 min-w-0 md:mt-3.5">
        <p className="truncate text-[13px] font-semibold tracking-tight text-foreground md:text-[14px]">
          {product.brand}
        </p>
        <p className="mt-1 truncate text-[13px] leading-5 text-[#8B8B8B] dark:text-muted-foreground">
          {product.name}
        </p>
        <p className="mt-2 flex items-baseline gap-1 tabular-nums">
          {rate ? (
            <span className="text-[13px] font-bold text-[#F04452]">{rate}%</span>
          ) : null}
          <span className="text-[14px] font-bold tracking-tight text-foreground md:text-[15px]">
            {formatPrice(product.price)}
            <span className="ml-0.5 text-[12px] font-semibold">원</span>
          </span>
        </p>
      </div>
    </Link>
  );
}

export function PriceBandSection({
  tabs,
  moreHref,
}: {
  tabs: HomeTabProducts<string>[];
  moreHref?: string;
}) {
  const [tabId, setTabId] = useState(tabs[0]?.id ?? "");
  const tabPrefix = useId();
  const active = tabs.find((tab) => tab.id === tabId) ?? tabs[0];

  if (!active) return null;

  const products = active.products.slice(0, 4);

  return (
    <section className="bg-background" aria-labelledby="price-band-heading">
      <div className="container py-12 md:py-16">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="price-band-heading"
              className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]"
            >
              <span className="block">예산만 정하면,</span>
              <span className="block">명품은 골라드릴게요</span>
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
              원하는 가격대를 선택해 부담 없이 둘러보세요.
            </p>
          </div>

          {moreHref ? (
            <Link
              href={moreHref}
              className="mt-1.5 inline-flex shrink-0 items-center text-[13px] font-medium text-[#8B8B8B] transition-colors hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground md:text-[14px]"
            >
              전체보기
              <ChevronRight className="size-4" />
            </Link>
          ) : null}
        </div>

        <div
          role="tablist"
          aria-label="가격대"
          className="mt-7 flex flex-wrap gap-2 md:mt-8"
        >
          {tabs.map((tab) => {
            const selected = tab.id === active.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${tabPrefix}-${tab.id}`}
                aria-selected={selected}
                aria-controls={`${tabPrefix}-panel`}
                onClick={() => setTabId(tab.id)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[13px] font-semibold tracking-tight transition-colors md:px-4 md:py-2.5 md:text-[14px]",
                  selected
                    ? "bg-foreground text-background"
                    : "bg-[#F7F7F7] text-[#6B6B6B] hover:text-foreground dark:bg-muted dark:text-muted-foreground dark:hover:text-foreground"
                )}
              >
                {tab.shortLabel ?? tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            id={`${tabPrefix}-panel`}
            role="tabpanel"
            aria-labelledby={`${tabPrefix}-${active.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-6 md:mt-8"
          >
            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
                {products.map((product) => (
                  <PriceBandCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-[#8B8B8B] dark:text-muted-foreground">
                이 금액대 상품을 준비하고 있어요
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
