"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { topBrands } from "@/data/topBrands";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 9;

function chunkBrands<T>(items: T[], size: number) {
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }
  return pages;
}

export function TopBrandSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 1 });
  const pages = chunkBrands(topBrands, PAGE_SIZE);
  const canScroll = pages.length > 1;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !canScroll) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const ratio = el.clientWidth / el.scrollWidth;
      const width = Math.max(0.22, ratio);
      const left = max <= 0 ? 0 : (el.scrollLeft / max) * (1 - width);
      setThumb({ left, width });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [canScroll]);

  return (
    <section className="bg-background">
      <div className="container pb-6 pt-6 md:pb-10 md:pt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[14px] font-bold tracking-[0.04em] text-foreground md:text-base">
            TOP BRAND
          </h2>
          <Link
            href="/brand"
            className="home-more"
          >
            브랜드 전체보기
          </Link>
        </div>

        <div
          ref={scrollerRef}
          className={cn(
            "mt-3 md:mt-4",
            canScroll && "flex snap-x snap-mandatory overflow-x-auto no-scrollbar"
          )}
        >
          {pages.map((page, pageIndex) => (
            <ul
              key={pageIndex}
              className={cn(
                "grid grid-cols-3",
                canScroll && "w-full shrink-0 snap-start"
              )}
            >
              {page.map((brand) => (
                <li key={brand.id} className="border-border/70">
                  <Link
                    href={brand.href}
                    className="group flex aspect-[1.55] items-center justify-center px-3 py-3 md:aspect-[1.5] md:px-6 md:py-5"
                    aria-label={brand.wordmark}
                  >
                    <span className="relative block h-full w-full">
                      <Image
                        src={brand.logoSrc}
                        alt={brand.wordmark}
                        fill
                        sizes="(min-width: 768px) 20vw, 30vw"
                        unoptimized
                        className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>

        {canScroll ? (
          <div className="mx-auto mt-1 h-[3px] w-16 overflow-hidden rounded-full bg-[#E6E6E6] md:w-20">
            <div
              className="h-full rounded-full bg-[#222]"
              style={{
                width: `${thumb.width * 100}%`,
                marginLeft: `${thumb.left * 100}%`,
              }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
