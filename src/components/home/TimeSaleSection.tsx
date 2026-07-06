"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatPrice, getDiscountRate } from "@/lib/formatPrice";
import type { Product } from "@/types/product";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Sale window ends at the end of tomorrow → counts down through ~48h. */
function getSaleEnd(): number {
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  end.setDate(end.getDate() + 1);
  return end.getTime();
}

function Countdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const end = getSaleEnd();
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const hours = remaining === null ? 0 : Math.floor(remaining / 3_600_000);
  const minutes = remaining === null ? 0 : Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = remaining === null ? 0 : Math.floor((remaining % 60_000) / 1000);

  const cell = "min-w-[2ch] text-center";

  return (
    <div
      className="flex items-center justify-center gap-2 font-serif text-2xl font-semibold tabular-nums text-foreground md:text-3xl"
      aria-live="off"
      suppressHydrationWarning
    >
      <span className={cell}>{pad(hours)}</span>
      <span className="text-gold">:</span>
      <span className={cell}>{pad(minutes)}</span>
      <span className="text-gold">:</span>
      <span className={cell}>{pad(seconds)}</span>
    </div>
  );
}

function SaleCard({ product }: { product: Product }) {
  const [wished, setWished] = useState(false);
  const rate = product.discountRate ?? getDiscountRate(product.price, product.retailPrice);
  return (
    <article className="group relative w-[78%] shrink-0 snap-start overflow-hidden rounded-lg bg-background sm:w-[calc((100%_-_1rem)/2)] lg:w-[calc((100%_-_2rem)/3)]">
      <Link href={product.href} className="block">
        {/* image */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#f6f7f8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            className="h-full w-full object-contain p-6 mix-blend-multiply"
          />
        </div>

        {/* dark footer bar */}
        <div className="flex items-center justify-between gap-3 bg-foreground px-4 py-3 text-background">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{product.brand}</p>
            <p className="flex items-baseline gap-1.5 text-sm tabular-nums text-background/80">
              <span>{formatPrice(product.price)}원</span>
              {rate ? (
                <span className="font-bold text-gold">
                  {rate}%
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </Link>
      <button
        type="button"
        aria-label={wished ? "찜 해제" : "찜하기"}
        aria-pressed={wished}
        onClick={() => setWished((value) => !value)}
        className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-transparent"
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

export function TimeSaleSection({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const saleProducts = products.filter(
    (p) => (p.discountRate ?? getDiscountRate(p.price, p.retailPrice)) !== undefined
  );

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="bg-[#f7f8f9]">
      <div className="container py-10 md:py-14">
        {/* heading + countdown */}
        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            오늘의 타임세일
          </h2>
          <div className="mt-3">
            <Countdown />
          </div>
        </div>

        {/* carousel */}
        <div className="relative mt-8">
          {/* arrows (desktop) */}
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
            className={cn(
              "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 no-scrollbar"
            )}
          >
            {saleProducts.map((product) => (
              <SaleCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
