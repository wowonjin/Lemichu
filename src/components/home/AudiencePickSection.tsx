"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal, panelItem, panelStagger } from "@/components/home/section-motion";
import { ProductPreviewMedia } from "@/components/product/ProductPreviewMedia";
import { cn } from "@/lib/cn";
import { formatPrice, getDiscountRate } from "@/lib/formatPrice";
import { WishlistToggleButton } from "@/components/product/WishlistToggleButton";
import { audienceMoreHref } from "@/lib/homeCollection";
import type { HomeTabProducts } from "@/lib/homeCatalog";
import type { Product } from "@/types/product";
import type { AudiencePickId } from "@/data/homeContent";

const VISIBLE_COUNT = 4;

function AudienceProductCard({ product }: { product: Product }) {
  const rate = product.discountRate ?? getDiscountRate(product.price, product.retailPrice);

  return (
    <article className="group relative">
      <Link href={product.href} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#F7F7F7] dark:bg-muted">
          <ProductPreviewMedia
            product={product}
            sizes="(min-width: 1024px) 22vw, 48vw"
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
}: {
  title: string;
  description?: string;
  tabs: HomeTabProducts<AudiencePickId>[];
}) {
  const [tabId, setTabId] = useState(tabs[0]?.id ?? "");
  const tabPrefix = useId();
  const reduceMotion = useReducedMotion();
  const active = tabs.find((tab) => tab.id === tabId) ?? tabs[0];

  if (!active) return null;

  const products = active.products.slice(0, VISIBLE_COUNT);

  return (
    <section className="bg-background" aria-labelledby="audience-heading">
      <div className="container home-section">
        <Reveal className="flex items-start justify-between gap-3">
          <div className="min-w-0 max-w-[640px]">
            <h2 id="audience-heading" className="home-title">
              {title}
            </h2>
            {description ? <p className="home-desc">{description}</p> : null}
          </div>

          <Link href={audienceMoreHref(active.id)} className="home-more mt-1">
            전체보기
            <ChevronRight className="size-4" />
          </Link>
        </Reveal>

        <Reveal delay={0.08} variant="soft">
          <div
            role="tablist"
            aria-label="상황별 큐레이션"
            className="mt-5 grid grid-cols-2 gap-2 md:mt-8 md:grid-cols-4 md:gap-3"
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
                    "rounded-md px-3 py-3 text-left transition-colors duration-200 md:min-h-[112px] md:px-6 md:py-6",
                    selected
                      ? "bg-foreground text-background"
                      : "bg-[#F7F7F7] text-foreground hover:bg-[#F0F0F0] dark:bg-muted dark:hover:bg-secondary"
                  )}
                >
                  <span className="block text-[13px] font-bold leading-5 tracking-tight md:text-[17px]">
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
        </Reveal>

        <AnimatePresence mode="wait">
          {products.length > 0 ? (
            <motion.div
              key={active.id}
              id={`${tabPrefix}-panel`}
              role="tabpanel"
              aria-labelledby={`${tabPrefix}-${active.id}`}
              initial={reduceMotion ? false : "hidden"}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={panelStagger}
              className="home-product-grid md:gap-y-0"
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={reduceMotion ? undefined : panelItem}>
                  <AudienceProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.p
              key={`${active.id}-empty`}
              id={`${tabPrefix}-panel`}
              role="tabpanel"
              aria-labelledby={`${tabPrefix}-${active.id}`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 py-16 text-center text-sm text-[#8B8B8B] dark:text-muted-foreground md:mt-8"
            >
              아직 맞는 상품을 고르고 있어요
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
