"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { heroSlides as fallbackSlides, type HeroSlide } from "@/data/campaigns";

const AUTO_MS = 6200;
const SWIPE_THRESHOLD = 48;
const ease = [0.22, 1, 0.36, 1] as const;

const slideVariants = {
  enter: (direction: 1 | -1) => ({
    x: direction > 0 ? "100%" : "-100%",
  }),
  center: {
    x: "0%",
  },
  exit: (direction: 1 | -1) => ({
    x: direction > 0 ? "-100%" : "100%",
  }),
};

const textVariants = {
  enter: { opacity: 0, x: 36 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export function HeroCarousel({ slides = fallbackSlides }: { slides?: HeroSlide[] }) {
  const heroSlides = slides.length > 0 ? slides : fallbackSlides;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const total = heroSlides.length;
  const pointerStart = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const safeIndex = index % total;
  const slide = heroSlides[safeIndex] ?? heroSlides[0];
  const dark = slide.dark;

  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [index, total]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setDirection(dir);
      setIndex((current) => ((current + dir) % total + total) % total);
      setProgressKey((value) => value + 1);
    },
    [total]
  );

  const jump = useCallback(
    (next: number) => {
      if (next === index) return;
      setDirection(next > index || (index === total - 1 && next === 0) ? 1 : -1);
      setIndex(((next % total) + total) % total);
      setProgressKey((value) => value + 1);
    },
    [index, total]
  );

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => go(1), AUTO_MS);
    return () => window.clearInterval(timer);
  }, [paused, go]);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    pointerStart.current = event.clientX;
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    go(delta < 0 ? 1 : -1);
  };

  return (
    <section
      className="group relative overflow-hidden bg-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="relative aspect-[4/5] overflow-hidden sm:aspect-auto sm:h-[420px] md:h-[480px] lg:h-[560px]">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.82, ease }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src={slide.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_45%]"
              draggable={false}
              initial={reduceMotion ? false : { scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 6.4, ease: "linear" }
              }
            />
            <div
              className={cn(
                "absolute inset-0",
                dark
                  ? "bg-gradient-to-r from-black/72 via-black/28 to-transparent"
                  : "bg-gradient-to-r from-white/78 via-white/28 to-transparent"
              )}
            />

            <div className="container relative flex h-full items-center">
              <motion.div
                custom={direction}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.55, delay: 0.14, ease }}
                className={cn("max-w-[15.5rem] md:max-w-lg", dark ? "text-background" : "text-foreground")}
              >
                <h2 className="text-[22px] font-semibold leading-[1.25] tracking-tight md:text-5xl md:leading-tight">
                  {slide.title}
                </h2>
                <p
                  className={cn(
                    "mt-2.5 max-w-md text-[13px] leading-5 md:mt-4 md:text-base md:leading-relaxed",
                    dark ? "text-background/75" : "text-muted-foreground"
                  )}
                >
                  {slide.subtitle}
                </p>
                <Button asChild variant={dark ? "gold" : "default"} className="mt-5 h-10 px-5 text-[13px] md:mt-7 md:h-12 md:px-8 md:text-base">
                  <Link href={slide.ctaHref}>
                    {slide.ctaLabel}
                    <ArrowRight />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.div
          className="absolute inset-x-0 bottom-3.5 z-20 flex items-center justify-center gap-1.5 md:bottom-7 md:gap-2"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease }}
        >
            {heroSlides.map((item, slideIndex) => (
              <button
                key={item.id}
                type="button"
                aria-label={`${slideIndex + 1}번째 슬라이드`}
                onClick={() => jump(slideIndex)}
                className={cn(
                  "relative h-1.5 overflow-hidden rounded-full transition-all",
                  slideIndex === index ? "w-9" : "w-1.5",
                  dark ? "bg-background/30" : "bg-foreground/20"
                )}
              >
                {slideIndex === index ? (
                  <span
                    key={progressKey}
                    className={cn(
                      "absolute inset-y-0 left-0 w-full rounded-full animate-hero-progress",
                      dark ? "bg-background" : "bg-foreground",
                      paused && "animate-hero-progress-paused"
                    )}
                  />
                ) : null}
              </button>
            ))}
        </motion.div>
        </div>
    </section>
  );
}
