"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/product";
import { SectionHeader } from "./SectionHeader";

export function ProductRail({
  title,
  products,
  moreHref,
}: {
  title: string;
  products: Product[];
  moreHref?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="container py-10 md:py-14">
      <SectionHeader title={title} moreHref={moreHref} />

      <div className="relative mt-6">
        {/* arrows (desktop) */}
        <button
          type="button"
          aria-label="이전"
          onClick={() => scrollByCards(-1)}
          className="absolute -left-9 top-[38%] z-10 hidden size-8 place-items-center text-muted-foreground transition-colors hover:text-foreground/70 md:grid"
        >
          <ChevronLeft className="size-7" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="다음"
          onClick={() => scrollByCards(1)}
          className="absolute -right-9 top-[38%] z-10 hidden size-8 place-items-center text-muted-foreground transition-colors hover:text-foreground/70 md:grid"
        >
          <ChevronRight className="size-7" strokeWidth={1.8} />
        </button>

        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 no-scrollbar"
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[22%] lg:w-[18%] xl:w-[15.5%]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
