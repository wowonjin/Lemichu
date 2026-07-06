"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { getPlaceholderGradient, isRealImage } from "@/lib/placeholder";
import { formatPrice } from "@/lib/formatPrice";
import { rankingTabs, type RankingTabId } from "@/data/mockProducts";
import type { RankedProduct } from "@/types/product";
import { SectionHeader } from "./SectionHeader";

function TrendIndicator({ trend }: { trend: RankedProduct["trend"] }) {
  if (trend === "new") {
    return (
      <span className="text-[10px] font-bold uppercase tracking-wide text-gold">
        NEW
      </span>
    );
  }
  if (trend > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600">
        <TrendingUp className="size-3" />
        {trend}
      </span>
    );
  }
  if (trend < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-rose-500">
        <TrendingDown className="size-3" />
        {Math.abs(trend)}
      </span>
    );
  }
  return <Minus className="size-3 text-muted-foreground" />;
}

function RankingRow({ product }: { product: RankedProduct }) {
  return (
    <Link
      href={product.href}
      className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/60"
    >
      <div className="flex w-7 shrink-0 flex-col items-center">
        <span className="font-serif text-lg font-semibold tabular-nums text-foreground">
          {product.rank}
        </span>
        <TrendIndicator trend={product.trend} />
      </div>

      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-transparent bg-[#f6f7f8]">
        {isRealImage(product.imageUrl) ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="64px"
            className="h-full w-full object-contain p-2 mix-blend-multiply"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ backgroundImage: getPlaceholderGradient(product.id) }}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{product.brand}</p>
        <p className="truncate text-xs text-muted-foreground">{product.name}</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
          {formatPrice(product.price)}원
        </p>
      </div>
    </Link>
  );
}

function matchesRankingTab(product: RankedProduct, tab: RankingTabId) {
  if (tab === "all") return true;
  if (tab === "pre-owned") return product.isPreOwned;

  const text = `${product.brand} ${product.name} ${product.color ?? ""} ${
    product.size ?? ""
  } ${product.badges.join(" ")}`.toLowerCase();

  if (tab === "women-bags") {
    return ["백", "토트", "숄더", "체인", "플랩", "호보", "가방"].some((keyword) =>
      text.includes(keyword.toLowerCase())
    );
  }
  if (tab === "men-bags") {
    return ["서류", "백팩", "메신저", "브리프", "비즈니스"].some((keyword) =>
      text.includes(keyword.toLowerCase())
    );
  }
  if (tab === "wallets") {
    return ["월릿", "월렛", "지갑", "카드"].some((keyword) =>
      text.includes(keyword.toLowerCase())
    );
  }
  if (tab === "shoes") {
    return ["스니커", "로퍼", "샌들", "부츠", "슈즈"].some((keyword) =>
      text.includes(keyword.toLowerCase())
    );
  }
  return ["워치", "시계", "롤렉스", "데이저스트"].some((keyword) =>
    text.includes(keyword.toLowerCase())
  );
}

export function RankingSection({ rankedProducts }: { rankedProducts: RankedProduct[] }) {
  const [tab, setTab] = useState<RankingTabId>("all");
  const products = rankedProducts.filter((product) => matchesRankingTab(product, tab));

  return (
    <section className="bg-sand">
      <div className="container py-10 md:py-14">
        <SectionHeader
          title="실시간 인기 랭킹"
          moreHref="/ranking"
        />

        {/* Tabs */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {rankingTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                tab === t.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-6 grid gap-x-6 gap-y-1 md:grid-cols-2 lg:grid-cols-3"
          >
            {products.map((product) => (
              <RankingRow key={product.id} product={product} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
