"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, Check, LineChart, RefreshCw, Store } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/home/section-motion";
import { cn } from "@/lib/cn";

const PREVIEW = {
  brand: "CHANEL",
  name: "Classic Flap Medium",
  price: "7,800,000 ~ 8,600,000원",
  imageUrl: "/product-images/sell-quote-classic-flap.jpg",
  imageAlt: "샤넬 클래식 플랩 미디움 예시 사진",
  grade: "A",
  deals: 12,
} as const;

const PHOTO_HINTS = ["가방", "시계", "주얼리", "지갑"] as const;

const STEPS = [
  { label: "사진 업로드", icon: Camera },
  { label: "예상 시세 확인", icon: LineChart },
  { label: "판매 방식 선택", icon: Store },
] as const;

const SELL_CHOICES = [
  { href: "/sell/estimate", title: "바로 판매" },
  { href: "/sell/consignment", title: "위탁 판매" },
] as const;

const STEP_EASE = [0.22, 1, 0.36, 1] as const;

function StepConnector({
  filled,
  hidden,
  delay = 0,
  reduceMotion,
}: {
  filled: boolean;
  hidden?: boolean;
  delay?: number;
  reduceMotion: boolean;
}) {
  return (
    <div
      className={cn("relative h-px flex-1 overflow-hidden", hidden && "invisible")}
      aria-hidden
    >
      <span className="absolute inset-0 bg-[#E6E6E6] dark:bg-border" />
      <motion.span
        className="absolute inset-0 origin-left bg-[#3182F6]"
        initial={false}
        animate={{ scaleX: filled ? 1 : 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.5, ease: STEP_EASE, delay }
        }
      />
    </div>
  );
}

function QuoteProcessStep({
  item,
  index,
  activeStep,
  reduceMotion,
}: {
  item: (typeof STEPS)[number];
  index: number;
  activeStep: number;
  reduceMotion: boolean;
}) {
  const step = index + 1;
  const complete = step < activeStep;
  const current = step === activeStep;
  const Icon = item.icon;

  return (
    <motion.li
      className="flex flex-1 flex-col items-center"
      aria-current={current ? "step" : undefined}
      variants={{
        hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: reduceMotion ? 0 : 0.45, ease: STEP_EASE },
        },
      }}
    >
      <div className="flex w-full items-center">
        <StepConnector
          filled={index > 0 && (complete || current)}
          hidden={index === 0}
          delay={0.06}
          reduceMotion={reduceMotion}
        />
        <span className="relative grid size-9 shrink-0 place-items-center md:size-10">
          {current && !reduceMotion ? (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#3182F6]/45"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.65, opacity: 0 }}
              transition={{ duration: 1.65, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          <motion.span
            key={complete ? "complete" : "pending"}
            className={cn(
              "relative z-10 grid size-9 place-items-center overflow-hidden rounded-full md:size-10",
              complete || current
                ? "bg-[#3182F6] text-white"
                : "bg-[#F4F4F4] text-[#B0B0B0] dark:bg-muted dark:text-muted-foreground",
              current && "shadow-[0_0_0_4px_rgba(49,130,246,0.16)]"
            )}
            initial={reduceMotion || !complete ? false : { scale: 0.82 }}
            animate={{ scale: current ? 1.06 : 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 22 }
            }
            aria-hidden
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={complete ? "check" : item.label}
                className="grid place-items-center"
                initial={
                  reduceMotion ? false : { opacity: 0, scale: 0.45, rotate: -24 }
                }
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={
                  reduceMotion
                    ? undefined
                    : { opacity: 0, scale: 0.45, rotate: 24 }
                }
                transition={{ duration: 0.22, ease: STEP_EASE }}
              >
                {complete ? (
                  <Check className="size-4" strokeWidth={2.6} />
                ) : (
                  <Icon className="size-4" strokeWidth={1.8} />
                )}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        </span>
        <StepConnector
          filled={index < STEPS.length - 1 && complete}
          hidden={index === STEPS.length - 1}
          delay={0.04}
          reduceMotion={reduceMotion}
        />
      </div>
      <span className="mt-2.5 flex flex-col items-center gap-0.5 text-center tracking-tight">
        <motion.span
          className={cn(
            "inline-block text-[10px] tabular-nums transition-colors duration-300 md:text-[11px]",
            current ? "font-semibold text-[#3182F6]" : "font-medium",
            !current && !complete && "text-[#B0B0B0] dark:text-muted-foreground"
          )}
          animate={reduceMotion ? { rotate: 0 } : { rotate: 360 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "linear",
                  delay: index * 0.18,
                }
          }
        >
          {String(step).padStart(2, "0")}
        </motion.span>
        <span
          className={cn(
            "text-[11px] leading-4 transition-colors duration-300 md:text-[13px] md:leading-5",
            current || complete
              ? "font-semibold text-foreground"
              : "font-medium text-[#B0B0B0] dark:text-muted-foreground"
          )}
        >
          {item.label}
        </span>
        {current ? <span className="sr-only"> 현재 단계</span> : null}
      </span>
    </motion.li>
  );
}

export function SellTradeCTA() {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [quoted, setQuoted] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  function applyFile(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    setPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setQuoted(false);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function handleCta() {
    if (!photoUrl) {
      openPicker();
      return;
    }
    if (!quoted) {
      setQuoted(true);
      return;
    }
    router.push("/sell/estimate");
  }

  const activeStep = quoted ? 3 : photoUrl ? 2 : 1;

  return (
    <section id="sell-quote" className="bg-[#F7F7F7] dark:bg-muted">
      <div className="container py-12 md:py-16">
        <Reveal className="mx-auto max-w-[760px] text-center">
          <h2 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
            사진 한 장이면, 지금 팔 수 있는 가격을 알려드려요
          </h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
            브랜드와 상품을 확인해 예상 판매가를 빠르게 안내해드려요.
          </p>
        </Reveal>

        <Stagger
          stagger={0.12}
          delay={0.08}
          className="mx-auto mt-7 grid max-w-[880px] items-stretch gap-3 md:mt-8 md:grid-cols-2 md:gap-4"
        >
          <StaggerItem variant="left" className="min-w-0">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                applyFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <label
              htmlFor={inputId}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                applyFile(event.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex h-full min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-md bg-white px-6 py-8 text-center transition-colors dark:bg-card md:min-h-[360px]",
                dragging && "bg-[#F3F3F3] dark:bg-secondary",
                !photoUrl && !dragging && "hover:bg-[#FBFBFB] dark:hover:bg-secondary/60"
              )}
            >
              {photoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="업로드한 명품 사진"
                    className="max-h-[200px] w-auto object-contain md:max-h-[220px]"
                  />
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#8B8B8B] dark:text-muted-foreground">
                    <RefreshCw className="size-3" strokeWidth={2.2} />
                    다른 사진으로 바꾸기
                  </span>
                </>
              ) : (
                <>
                  <span
                    className={cn(
                      "grid size-14 place-items-center rounded-md transition-colors",
                      dragging
                        ? "bg-foreground text-background"
                        : "bg-[#F4F4F4] text-foreground dark:bg-muted"
                    )}
                  >
                    <Camera className="size-6" strokeWidth={1.6} />
                  </span>
                  <span className="mt-4 text-[18px] font-bold tracking-tight text-foreground md:text-[20px]">
                    사진 올리기
                  </span>
                  <span className="mt-1.5 text-[13px] leading-5 text-[#8B8B8B] dark:text-muted-foreground">
                    클릭하거나 사진을 끌어다 놓으세요
                  </span>
                  <span className="mt-5 text-[12px] tracking-tight text-[#B0B0B0] dark:text-muted-foreground">
                    {PHOTO_HINTS.join(" · ")}
                  </span>
                </>
              )}
            </label>
          </StaggerItem>

          <StaggerItem variant="right">
          <aside
            aria-label="시세 안내 예시"
            className="flex min-h-[300px] flex-col overflow-hidden rounded-md bg-white dark:bg-card md:min-h-[360px]"
          >
            <div className="relative aspect-[4/3] bg-[#EEECEA] dark:bg-secondary">
              <Image
                src={PREVIEW.imageUrl}
                alt={PREVIEW.imageAlt}
                fill
                sizes="(min-width: 768px) 420px, 90vw"
                className="object-cover"
              />
              <span className="absolute left-3 top-3 rounded-md bg-white/92 px-2.5 py-1 text-[11px] font-semibold tracking-tight text-foreground dark:bg-card">
                예시
              </span>
            </div>

            <div className="flex flex-1 flex-col px-5 py-4 md:px-6 md:py-5">
              <p className="text-[12px] font-semibold tracking-[0.08em] text-[#B0B0B0] dark:text-muted-foreground">
                {PREVIEW.brand}
              </p>
              <p className="mt-1 text-[15px] font-semibold tracking-tight text-foreground md:text-[16px]">
                {PREVIEW.name}
              </p>

              <p className="mt-3.5 text-[12px] font-medium text-[#8B8B8B] dark:text-muted-foreground">
                예상 판매가
              </p>
              <p className="mt-1 text-[22px] font-bold leading-tight tracking-tight text-foreground tabular-nums md:text-[24px]">
                {PREVIEW.price}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-[#F4F4F4] px-2 py-0.5 text-[11px] font-medium text-foreground dark:bg-muted">
                  등급 {PREVIEW.grade}
                </span>
                <span className="rounded-md bg-[#F4F4F4] px-2 py-0.5 text-[11px] font-medium text-[#8B8B8B] dark:bg-muted dark:text-muted-foreground">
                  최근 거래 {PREVIEW.deals}건
                </span>
              </div>
            </div>
          </aside>
          </StaggerItem>
        </Stagger>

        <Reveal delay={0.08} className="mx-auto mt-6 max-w-[880px] md:mt-7">
          <AnimatePresence initial={false}>
            {quoted ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-5"
              >
                <p className="text-center text-[13px] leading-5 text-[#8B8B8B] dark:text-muted-foreground">
                  사진을 확인했어요. 이어서 판매 방식을 선택할 수 있어요.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {SELL_CHOICES.map((choice) => (
                    <Link
                      key={choice.href}
                      href={choice.href}
                      className="inline-flex h-12 items-center justify-center rounded-md bg-white text-[14px] font-semibold text-foreground transition-colors hover:bg-[#F0F0F0] dark:bg-card dark:hover:bg-secondary"
                    >
                      {choice.title}
                    </Link>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <button
            type="button"
            onClick={handleCta}
            className="flex h-[56px] w-full items-center justify-center rounded-md bg-[#3182F6] px-6 text-white transition-[background-color,transform] hover:bg-[#1B64DA] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3182F6]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F7F7] dark:focus-visible:ring-offset-muted md:h-[60px]"
          >
            <span className="text-[15px] font-semibold tracking-tight md:text-[16px]">
              내 명품 시세 확인하기
            </span>
          </button>

          <motion.ol
            className="mt-4 flex items-start rounded-md bg-white px-2 py-4 dark:bg-card md:mt-5 md:px-6 md:py-5"
            aria-label="시세 확인 진행 단계"
            initial={reduceMotion ? "show" : "hidden"}
            whileInView="show"
            viewport={{ once: true, amount: 0.2, margin: "120px 0px" }}
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.1, delayChildren: 0.04 },
              },
            }}
          >
            {STEPS.map((item, index) => (
              <QuoteProcessStep
                key={item.label}
                item={item}
                index={index}
                activeStep={activeStep}
                reduceMotion={reduceMotion}
              />
            ))}
          </motion.ol>
        </Reveal>
      </div>
    </section>
  );
}
