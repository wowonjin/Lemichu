"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/cn";
import type { Product } from "@/types/product";

const PAGE_SIZE = 5;

function getPageStep(track: HTMLDivElement): number {
  const card = track.firstElementChild as HTMLElement | null;
  if (!card) return track.clientWidth;
  const gap = Number.parseFloat(getComputedStyle(track).columnGap || "16") || 16;
  return (card.offsetWidth + gap) * PAGE_SIZE;
}

export function RelatedProductRail({
  products,
  moreHref = "/products",
}: {
  products: Product[];
  moreHref?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [imageCenter, setImageCenter] = useState<number | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      setCanScroll(track.scrollWidth > track.clientWidth + 8);
      const image = track.querySelector<HTMLElement>(".aspect-square");
      if (image) {
        setImageCenter(image.offsetTop + image.offsetHeight / 2);
      }
    };

    update();
    track.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    const image = track.querySelector<HTMLElement>(".aspect-square");
    if (image) observer.observe(image);

    return () => {
      track.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [products.length]);

  const rotate = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const step = getPageStep(track);
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const nextLeft = track.scrollLeft + direction * step;

    if (direction === 1 && nextLeft > maxScroll - 4) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (direction === -1 && nextLeft < 4) {
      track.scrollTo({ left: maxScroll, behavior: "smooth" });
      return;
    }

    track.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section id="similar-products" className="scroll-mt-[calc(var(--header-height)+1rem)] pb-12 md:pb-16">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
            비슷한 상품 보기
          </h2>
          <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
            비슷한 컨디션과 같은 브랜드 상품을 함께 확인해 보세요.
          </p>
        </div>
        <Link
          href={moreHref}
          className="group hidden shrink-0 items-center gap-0.5 text-[13px] font-medium text-[#8B8B8B] transition-colors hover:text-foreground dark:text-muted-foreground md:inline-flex md:text-[14px]"
        >
          더보기
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="relative mt-7 md:mt-8">
        {canScroll ? (
          <>
            <RotateButton
              direction="prev"
              imageCenter={imageCenter}
              onClick={() => rotate(-1)}
            />
            <RotateButton
              direction="next"
              imageCenter={imageCenter}
              onClick={() => rotate(1)}
            />
          </>
        ) : null}
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto no-scrollbar"
        >
          {products.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              className="w-[calc((100%-1rem)/2)] shrink-0 sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RotateButton({
  direction,
  imageCenter,
  onClick,
}: {
  direction: "prev" | "next";
  imageCenter: number | null;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "이전 상품" : "다음 상품"}
      onClick={onClick}
      style={imageCenter != null ? { top: imageCenter } : undefined}
      className={cn(
        "absolute z-10 hidden size-10 -translate-y-1/2 place-items-center text-[#8B8B8B] transition-colors hover:text-foreground md:grid",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        direction === "prev" ? "-left-11" : "-right-11"
      )}
    >
      <Icon className="size-7" strokeWidth={1.8} />
    </button>
  );
}
