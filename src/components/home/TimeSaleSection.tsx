"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { ProductPreviewMedia } from "@/components/product/ProductPreviewMedia";
import { Reveal, Stagger, StaggerItem } from "@/components/home/section-motion";
import { cn } from "@/lib/cn";
import { formatPrice, getDiscountRate } from "@/lib/formatPrice";
import type { TimeSaleProduct } from "@/lib/homeCatalog";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function BlinkColon() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <span className="text-gold">:</span>;

  return (
    <motion.span
      className="text-gold"
      animate={{ opacity: [1, 0.28, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
    >
      :
    </motion.span>
  );
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (remaining === null) {
    return <p className="text-sm text-muted-foreground">오늘 자정 종료</p>;
  }

  if (remaining === 0) {
    return <p className="text-sm text-muted-foreground">오늘 세일이 종료되었습니다</p>;
  }

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-medium text-muted-foreground">오늘 자정 종료</p>
      <div
        className="flex items-center justify-center gap-2 font-serif text-2xl font-semibold tabular-nums text-foreground md:text-3xl"
        aria-live="off"
      >
        <span>{pad(hours)}</span>
        <BlinkColon />
        <span>{pad(minutes)}</span>
        <BlinkColon />
        <span>{pad(seconds)}</span>
      </div>
    </div>
  );
}

function SaleCard({ product }: { product: TimeSaleProduct }) {
  const [wished, setWished] = useState(false);
  const rate = product.discountRate ?? getDiscountRate(product.price, product.retailPrice);

  return (
    <article className="group relative overflow-hidden bg-background">
      <Link href={product.href} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          <ProductPreviewMedia
            product={product}
            sizes="(min-width: 1024px) 22vw, 70vw"
            imageClassName="object-cover mix-blend-multiply"
          >
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {product.remainingQty === 1 ? (
                <span className="rounded-md bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
                  남은 수량 1개
                </span>
              ) : (
                <span className="rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground">
                  남은 수량 {product.remainingQty}개
                </span>
              )}
            </div>
          </ProductPreviewMedia>
        </div>

        <div className="space-y-1.5 bg-foreground px-4 py-3 text-background">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold">{product.brand}</p>
            {rate ? <span className="shrink-0 text-sm font-bold text-[#F04452]">{rate}%</span> : null}
          </div>
          <p className="text-sm tabular-nums text-background/80">{formatPrice(product.price)}원</p>
          <p className="text-[11px] text-background/60">오늘 {product.wishCount}명이 찜했어요</p>
        </div>
      </Link>
      <button
        type="button"
        aria-label={wished ? "찜 해제" : "찜하기"}
        aria-pressed={wished}
        onClick={() => setWished((value) => !value)}
        className="absolute right-3 top-3 grid size-8 place-items-center"
      >
        <Heart
          className={cn(
            "size-4 transition-all",
            wished ? "fill-red-500 text-red-500" : "fill-transparent text-foreground/70"
          )}
        />
      </button>
    </article>
  );
}

export function TimeSaleSection({
  products,
  endsAt,
}: {
  products: TimeSaleProduct[];
  endsAt: string | null;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const saleProducts = products.slice(0, 6);

  if (!endsAt || saleProducts.length === 0) return null;

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="bg-background">
      <div className="container py-10 md:py-14">
        <Reveal className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            오늘의 타임세일
          </h2>
          <div className="mt-3">
            <Countdown endsAt={endsAt} />
          </div>
        </Reveal>

        <div className="relative mt-8">
          <button
            type="button"
            aria-label="이전"
            onClick={() => scrollByCards(-1)}
            className="absolute -left-9 top-[42%] z-10 hidden size-8 place-items-center text-muted-foreground transition-colors hover:text-foreground/70 md:grid"
          >
            <ChevronLeft className="size-7" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="다음"
            onClick={() => scrollByCards(1)}
            className="absolute -right-9 top-[42%] z-10 hidden size-8 place-items-center text-muted-foreground transition-colors hover:text-foreground/70 md:grid"
          >
            <ChevronRight className="size-7" strokeWidth={1.8} />
          </button>

          <div
            ref={trackRef}
            className="overflow-x-auto py-1 no-scrollbar"
          >
            <Stagger
              stagger={0.08}
              delay={0.08}
              className="flex snap-x snap-mandatory gap-4 pb-1"
            >
              {saleProducts.map((product) => (
                <StaggerItem
                  key={product.id}
                  variant="scale"
                  className="w-[78%] shrink-0 snap-start sm:w-[calc((100%_-_1rem)/2)] lg:w-[calc((100%_-_3rem)/4)]"
                >
                  <SaleCard product={product} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </div>
    </section>
  );
}
