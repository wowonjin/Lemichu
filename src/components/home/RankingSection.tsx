"use client";

import { useId, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/formatPrice";
import { getPlaceholderGradient, isRealImage } from "@/lib/placeholder";
import type { RankedProduct } from "@/types/product";

const VISIBLE_LIMIT = 4;

const HOME_RANKING_TABS = [
  { id: "all", label: "전체" },
  { id: "pre-owned", label: "중고" },
] as const;

type HomeRankingTabId = (typeof HOME_RANKING_TABS)[number]["id"];

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
      <div className="relative aspect-square overflow-hidden rounded-[16px] bg-[#F7F7F7] dark:bg-muted">
        <span
          className="absolute left-3.5 top-3 z-10 text-[14px] font-bold tabular-nums tracking-tight text-foreground md:left-4 md:top-3.5 md:text-[15px]"
          aria-hidden
        >
          {padRank(rank)}
        </span>
        <span className="sr-only">{rank}위</span>

        <span className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold tracking-tight text-[#6B6B6B] md:right-3.5 md:top-3.5 dark:bg-background/70 dark:text-muted-foreground">
          {badge}
        </span>

        {isRealImage(product.imageUrl) ? (
          <Image
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
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

export function RankingSection({ rankedProducts }: { rankedProducts: RankedProduct[] }) {
  const [tab, setTab] = useState<HomeRankingTabId>("all");
  const tabPrefix = useId();
  const products = rankedProducts
    .filter((product) => matchesRankingTab(product, tab))
    .slice(0, VISIBLE_LIMIT);

  return (
    <section className="bg-background" aria-labelledby="ranking-heading">
      <div className="container py-12 md:py-16">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="ranking-heading"
              className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]"
            >
              지금 많이 보고 있어요
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
              실시간 관심 상품을 확인해보세요
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1 pt-1.5">
            <p className="text-[13px] font-medium tabular-nums tracking-tight text-[#8B8B8B] dark:text-muted-foreground">
              10분 전 업데이트
            </p>
            <Link
              href="/ranking"
              className="inline-flex items-center text-[13px] font-medium text-[#8B8B8B] transition-colors hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground md:text-[14px]"
            >
              전체보기
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="랭킹 카테고리"
          className="mt-7 flex items-end gap-6 md:mt-8"
        >
          {HOME_RANKING_TABS.map((item) => {
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
                  "relative pb-2 text-[15px] font-semibold transition-colors md:text-[16px]",
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

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            id={`${tabPrefix}-panel`}
            role="tabpanel"
            aria-labelledby={`${tabPrefix}-${tab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-6 md:mt-8"
          >
            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
                {products.map((product, index) => (
                  <RankingCard key={product.id} product={product} rank={index + 1} />
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-[#8B8B8B] dark:text-muted-foreground">
                아직 집계된 상품이 없어요
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
