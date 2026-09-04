"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal, panelItem, panelStagger } from "@/components/home/section-motion";
import { ProductPreviewMedia } from "@/components/product/ProductPreviewMedia";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/formatPrice";
import { rankingMoreHref } from "@/lib/homeCollection";
import type { RankedProduct } from "@/types/product";

const VISIBLE_LIMIT = 4;

const HOME_RANKING_TABS = [
  { id: "all", label: "전체" },
  { id: "pre-owned", label: "중고" },
] as const;

type HomeRankingTabId = (typeof HOME_RANKING_TABS)[number]["id"];

export type HomeRankingTab = {
  id: HomeRankingTabId;
  label: string;
  products: RankedProduct[];
};

type ShowcaseBadge = "NEW" | "급상승" | "인기";

function padRank(rank: number) {
  return String(rank).padStart(2, "0");
}

function getShowcaseBadge(product: RankedProduct): ShowcaseBadge {
  if (product.trend === "new") return "NEW";
  if (typeof product.trend === "number" && product.trend > 0) return "급상승";
  return "인기";
}

function matchesRankingTab(product: RankedProduct, tab: HomeRankingTabId) {
  if (tab === "all") return true;
  return product.isPreOwned;
}

function RankingCard({ product, rank }: { product: RankedProduct; rank: number }) {
  const badge = getShowcaseBadge(product);

  return (
    <Link href={product.href} className="group block">
      <div className="relative aspect-square overflow-hidden bg-[#F7F7F7] dark:bg-muted">
        <span
          className="absolute left-3.5 top-3 z-10 text-[14px] font-bold tabular-nums tracking-tight text-foreground md:left-4 md:top-3.5 md:text-[15px]"
          aria-hidden
        >
          {padRank(rank)}
        </span>
        <span className="sr-only">{rank}위</span>

        <span
          className={cn(
            "absolute right-3 top-3 z-10 inline-flex h-[22px] items-center rounded-[4px] px-1.5 text-[11px] font-semibold tracking-tight ring-1 ring-inset md:right-3.5 md:top-3.5",
            badge === "NEW" &&
              "bg-[#EEFBF4] text-[#0F7A4B] ring-[#B7E4CC] dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
            badge === "급상승" &&
              "bg-[#FFF0F1] text-[#C81E3A] ring-[#F5C2C8] dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/25",
            badge === "인기" &&
              "bg-[#FFF4E5] text-[#C05621] ring-[#F0C48A] dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/25"
          )}
        >
          {badge}
        </span>

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
        <p className="mt-2 tabular-nums">
          <span className="text-[14px] font-bold tracking-tight text-foreground md:text-[15px]">
            {formatPrice(product.price)}
            <span className="ml-0.5 text-[12px] font-semibold">원</span>
          </span>
        </p>
      </div>
    </Link>
  );
}

export function RankingSection({
  rankedProducts,
  rankedTabs,
}: {
  rankedProducts?: RankedProduct[];
  rankedTabs?: HomeRankingTab[];
}) {
  const [tab, setTab] = useState<HomeRankingTabId>("all");
  const tabPrefix = useId();
  const reduceMotion = useReducedMotion();
  const tabs = rankedTabs?.length
    ? rankedTabs
    : HOME_RANKING_TABS.map((item) => ({
        id: item.id,
        label: item.label,
        products: (rankedProducts ?? []).filter((product) => matchesRankingTab(product, item.id)),
      }));
  const active = tabs.find((item) => item.id === tab) ?? tabs[0];
  const products = (active?.products ?? []).slice(0, VISIBLE_LIMIT);

  return (
    <section className="bg-background" aria-labelledby="ranking-heading">
      <div className="container home-section">
        <Reveal className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="ranking-heading" className="home-title">
              지금 많이 보고 있어요
            </h2>
            <p className="home-desc">
              실시간 관심 상품을 확인해보세요
            </p>
          </div>

          <Link href={rankingMoreHref(tab)} className="home-more mt-1">
            전체보기
            <ChevronRight className="size-4" />
          </Link>
        </Reveal>

        <Reveal delay={0.08} variant="soft">
          <div
            role="tablist"
            aria-label="랭킹 카테고리"
            className="mt-5 flex items-end gap-5 md:mt-8 md:gap-6"
          >
            {tabs.map((item) => {
              const selected = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`${tabPrefix}-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`${tabPrefix}-panel`}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "relative pb-2 text-[14px] font-semibold transition-colors md:text-[16px]",
                    selected
                      ? "text-foreground"
                      : "text-[#8B8B8B] hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
                  )}
                >
                  {item.label}
                  {selected ? (
                    <motion.span
                      layoutId="ranking-tab-underline"
                      className="absolute inset-x-0 bottom-0 h-[2px] bg-foreground"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          {products.length > 0 ? (
            <motion.div
              key={tab}
              id={`${tabPrefix}-panel`}
              role="tabpanel"
              aria-labelledby={`${tabPrefix}-${tab}`}
              initial={reduceMotion ? false : "hidden"}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={panelStagger}
              className="home-product-grid"
            >
              {products.map((product, index) => (
                <motion.div key={product.id} variants={reduceMotion ? undefined : panelItem}>
                  <RankingCard product={product} rank={index + 1} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.p
              key={`${tab}-empty`}
              id={`${tabPrefix}-panel`}
              role="tabpanel"
              aria-labelledby={`${tabPrefix}-${tab}`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 py-16 text-center text-sm text-[#8B8B8B] dark:text-muted-foreground md:mt-8"
            >
              아직 집계된 상품이 없어요
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
