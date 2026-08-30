"use client";

import { useId, useMemo, useState, type ButtonHTMLAttributes } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal, panelItem, panelStagger } from "@/components/home/section-motion";
import { BrandSectionHeader } from "@/components/brand/BrandSectionHeader";
import { ProductGrid } from "@/components/product/ProductGrid";
import { categories } from "@/data/categories";
import { brandPriceBands, productMatchesPriceBand, type BrandPriceBandId } from "@/lib/brand-page";
import { cn } from "@/lib/cn";
import { sortProductsByAvailability } from "@/lib/productAvailability";
import { filterByCategory } from "@/lib/productFilter";
import type { Product } from "@/types/product";

function Chip({
  selected,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "rounded-md px-3.5 py-2 text-[13px] font-semibold tracking-tight transition-colors md:px-4 md:py-2.5 md:text-[14px]",
        selected
          ? "bg-foreground text-background"
          : "bg-[#F7F7F7] text-[#6B6B6B] hover:text-foreground dark:bg-muted dark:text-muted-foreground dark:hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function BrandShop({
  brandName,
  products,
  recommended,
}: {
  brandName: string;
  products: Product[];
  recommended: Product[];
}) {
  const [categoryId, setCategoryId] = useState("all");
  const [priceId, setPriceId] = useState<BrandPriceBandId>("all");
  const tabPrefix = useId();
  const reduceMotion = useReducedMotion();

  const categoryTabs = useMemo(() => {
    const tabs = categories
      .map((category) => ({
        id: category.id,
        label: category.label,
        count: filterByCategory(category.id, products).length,
      }))
      .filter((tab) => tab.count > 0);

    return [{ id: "all", label: "전체", count: products.length }, ...tabs];
  }, [products]);

  const priceTabs = useMemo(() => {
    return brandPriceBands.filter(
      (band) =>
        band.id === "all" || products.some((product) => productMatchesPriceBand(product, band.id))
    );
  }, [products]);

  const filtered = useMemo(() => {
    const inCategory =
      categoryId === "all" ? products : filterByCategory(categoryId, products);
    return sortProductsByAvailability(
      inCategory.filter((product) => productMatchesPriceBand(product, priceId))
    );
  }, [categoryId, priceId, products]);

  const showCategory = categoryTabs.length > 2;
  const showPrice = priceTabs.length > 2;
  const shopDescription =
    showCategory || showPrice
      ? "카테고리와 가격대로 골라보세요."
      : "검수 완료 상품을 한눈에 비교하세요.";

  if (products.length === 0) {
    return (
      <section className="bg-background" aria-labelledby="brand-empty-heading">
        <div className="container min-w-0 py-8 md:py-16">
          <Reveal>
            <BrandSectionHeader
              titleId="brand-empty-heading"
              title={`${brandName} 상품을 준비하고 있어요`}
              description="다른 인기 상품을 먼저 둘러보세요."
            />
          </Reveal>

          {recommended.length > 0 ? (
            <div className="mt-6 md:mt-8">
              <ProductGrid products={recommended} />
            </div>
          ) : (
            <p className="mt-10 py-10 text-center text-sm text-[#8B8B8B] dark:text-muted-foreground">
              곧 새로운 상품으로 찾아올게요.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background" aria-labelledby="brand-shop-heading">
      <div className="container min-w-0 py-8 md:py-16">
        <Reveal>
          <BrandSectionHeader
            titleId="brand-shop-heading"
            title={`${brandName} 전체 상품`}
            description={shopDescription}
            aside={
              <p className="text-[13px] font-medium tabular-nums tracking-tight text-[#8B8B8B] dark:text-muted-foreground">
                {filtered.length}개
              </p>
            }
          />
        </Reveal>

        {showCategory || showPrice ? (
          <Reveal delay={0.08} variant="soft" className="mt-7 space-y-3 md:mt-8">
            {showCategory ? (
              <div
                role="tablist"
                aria-label="카테고리"
                className="flex flex-wrap gap-2"
              >
                {categoryTabs.map((tab) => {
                  const selected = categoryId === tab.id;
                  return (
                    <Chip
                      key={tab.id}
                      role="tab"
                      id={`${tabPrefix}-cat-${tab.id}`}
                      aria-selected={selected}
                      selected={selected}
                      onClick={() => setCategoryId(tab.id)}
                    >
                      {tab.label}
                    </Chip>
                  );
                })}
              </div>
            ) : null}

            {showPrice ? (
              <div role="tablist" aria-label="가격대" className="flex flex-wrap gap-2">
                {priceTabs.map((tab) => {
                  const selected = priceId === tab.id;
                  return (
                    <Chip
                      key={tab.id}
                      role="tab"
                      id={`${tabPrefix}-price-${tab.id}`}
                      aria-selected={selected}
                      selected={selected}
                      onClick={() => setPriceId(tab.id)}
                    >
                      {tab.label}
                    </Chip>
                  );
                })}
              </div>
            ) : null}
          </Reveal>
        ) : null}

        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key={`${categoryId}-${priceId}`}
              initial={reduceMotion ? false : "hidden"}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={panelStagger}
              className="mt-6 md:mt-8"
            >
              <motion.div variants={reduceMotion ? undefined : panelItem}>
                <ProductGrid products={filtered} />
              </motion.div>
            </motion.div>
          ) : (
            <motion.p
              key={`${categoryId}-${priceId}-empty`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 py-16 text-center text-sm text-[#8B8B8B] dark:text-muted-foreground md:mt-8"
            >
              이 조건의 상품을 준비하고 있어요
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
