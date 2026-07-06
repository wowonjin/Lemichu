"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { getTemporaryImageUrl } from "@/lib/placeholder";
import { heroSlides } from "@/data/campaigns";

const AUTO_MS = 5000;
const cardTilt = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const total = heroSlides.length;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const rotate = useCallback(
    (dir: 1 | -1) => {
      setDirection(dir);
      setIndex((current) => ((current + dir) % total + total) % total);
    },
    [total]
  );

  const go = useCallback(
    (next: number) => {
      setDirection(next >= index ? 1 : -1);
      setIndex(((next % total) + total) % total);
    },
    [index, total]
  );

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(() => {
      rotate(1);
    }, AUTO_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, rotate]);

  const slide = heroSlides[index];
  const dark = slide.dark;

  return (
    <section
      className="group relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background layer (crossfade) */}
      <AnimatePresence>
        <motion.div
          key={`bg-${slide.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
          style={{ backgroundImage: slide.tone }}
          aria-hidden
        />
      </AnimatePresence>

      <button
        type="button"
        aria-label="이전 슬라이드"
        onClick={() => rotate(-1)}
        className={cn(
          "absolute left-4 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 md:left-8",
          dark ? "text-background/80" : "text-muted-foreground"
        )}
      >
        <ChevronLeft className="size-8" strokeWidth={1.7} />
      </button>
      <button
        type="button"
        aria-label="다음 슬라이드"
        onClick={() => rotate(1)}
        className={cn(
          "absolute right-4 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 md:right-8",
          dark ? "text-background/80" : "text-muted-foreground"
        )}
      >
        <ChevronRight className="size-8" strokeWidth={1.7} />
      </button>

      <div className="container relative">
        <div className="grid min-h-[360px] items-center gap-8 py-10 md:min-h-[580px] md:grid-cols-2 md:py-16">
          {/* Text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`txt-${slide.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45 }}
              className={cn("max-w-lg", dark ? "text-background" : "text-foreground")}
            >
              <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
                {slide.title}
              </h2>
              <p
                className={cn(
                  "mt-4 text-sm leading-relaxed md:text-base",
                  dark ? "text-background/75" : "text-muted-foreground"
                )}
              >
                {slide.subtitle}
              </p>
              <Button
                asChild
                size="lg"
                variant={dark ? "gold" : "default"}
                className="mt-6"
              >
                <Link href={slide.ctaHref}>
                  {slide.ctaLabel}
                  <ArrowRight />
                </Link>
              </Button>
            </motion.div>
          </AnimatePresence>

          {/* Cards */}
          <div className="relative hidden h-full items-center justify-center md:flex">
            <AnimatePresence mode="wait">
              <motion.div
                key={`cards-${slide.id}`}
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -16 }}
                transition={{ duration: 0.5 }}
                className="mx-auto grid w-full max-w-xl grid-cols-4 gap-3"
              >
                {slide.cards.map((card, i) => (
                  <div
                    key={card.seed}
                    className={cn(
                      "overflow-hidden rounded-xl border border-black/10 bg-background shadow-sm",
                      i % 2 === 0 ? "translate-y-3" : "-translate-y-3",
                      cardTilt[i % cardTilt.length]
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getTemporaryImageUrl(card.seed)}
                      alt={`${card.brand} ${card.name}`}
                      className="aspect-square w-full bg-[#f6f7f8] object-contain p-3 mix-blend-multiply"
                    />
                    <div className="space-y-1 p-2.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-[10px] font-semibold tracking-wide text-foreground">
                          {card.brand}
                        </span>
                        <span className="shrink-0 rounded bg-foreground px-1 py-0.5 text-[8px] font-medium text-background">
                          {card.badge}
                        </span>
                      </div>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {card.name}
                      </p>
                      <p className="text-[11px] font-semibold tabular-nums text-foreground">
                        {card.priceLabel}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-5 flex justify-center md:bottom-7">
          <div className="flex items-center gap-2">
            {heroSlides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`${i + 1}번째 슬라이드`}
                onClick={() => go(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index
                    ? dark
                      ? "w-6 bg-background"
                      : "w-6 bg-foreground"
                    : dark
                      ? "w-1.5 bg-background/40"
                      : "w-1.5 bg-foreground/30"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
