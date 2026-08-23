"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CatalogImage } from "@/components/product/CatalogImage";
import { cn } from "@/lib/cn";
import { formatPrice, getDiscountRate } from "@/lib/formatPrice";
import { WishlistToggleButton } from "@/components/product/WishlistToggleButton";
import type { HomeTabProducts } from "@/lib/homeCatalog";
import type { Product } from "@/types/product";

const VISIBLE_COUNT = 4;

function AudienceProductCard({ product }: { product: Product }) {
  const rate = product.discountRate ?? getDiscountRate(product.price, product.retailPrice);

  return (
    <article className="group relative">
      <Link href={product.href} className="block">
        <div className="relative aspect-square overflow-hidden rounded-[16px] bg-[#F7F7F7] dark:bg-muted">
          <CatalogImage
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            seed={product.id}
            sizes="(min-width: 1024px) 22vw, 48vw"
            className="object-contain p-6 mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.03] dark:mix-blend-normal md:p-7"
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

      <WishlistToggleButton
        product={product}
        className="absolute right-1.5 top-1.5 z-10 size-9"
        iconClassName="size-4"
      />
    </article>
  );
}

export function AudiencePickSection({
  title,
  description,
  tabs,
  moreHref,
}: {
  title: string;
  description?: string;
  tabs: HomeTabProducts<string>[];
  moreHref?: string;
}) {
  const [tabId, setTabId] = useState(tabs[0]?.id ?? "");
  const tabPrefix = useId();
  const active = tabs.find((tab) => tab.id === tabId) ?? tabs[0];

  if (!active) return null;

  const products = active.products.slice(0, VISIBLE_COUNT);

  return (
    <section className="bg-background" aria-labelledby="audience-heading">
      <div className="container py-12 md:py-16">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 max-w-[640px]">
            <h2
              id="audience-heading"
              className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
                {description}
              </p>
            ) : null}
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
          aria-label="상황별 큐레이션"
          className="mt-7 grid grid-cols-2 gap-2.5 md:mt-8 md:grid-cols-4 md:gap-3"
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
                  "rounded-[20px] px-4 py-4 text-left transition-colors duration-200 md:min-h-[112px] md:px-6 md:py-6",
                  selected
                    ? "bg-foreground text-background"
                    : "bg-[#F7F7F7] text-foreground hover:bg-[#F0F0F0] dark:bg-muted dark:hover:bg-secondary"
                )}
              >
                <span className="block text-[15px] font-bold leading-5 tracking-tight md:text-[17px]">
                  {tab.shortLabel ?? tab.label}
                </span>
                {tab.audience ? (
                  <span
                    className={cn(
                      "mt-1.5 block text-[12px] font-medium leading-5 md:mt-2 md:text-[13px]",
                      selected
                        ? "text-background/60"
                        : "text-[#8B8B8B] dark:text-muted-foreground"
                    )}
                  >
                    {tab.audience}
                  </span>
                ) : null}
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
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5 md:gap-y-0">
                {products.map((product) => (
                  <AudienceProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-[#8B8B8B] dark:text-muted-foreground">
                아직 맞는 상품을 고르고 있어요
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
