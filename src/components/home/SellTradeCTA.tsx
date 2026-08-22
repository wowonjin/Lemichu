"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

const PREVIEW = {
  name: "CHANEL Classic Flap",
  price: "7,800,000 ~ 8,600,000원",
  note: "최근 거래 데이터를 기준으로 예상",
} as const;

const STEPS = ["사진 업로드", "예상 시세 확인", "판매 방식 선택"] as const;

const SELL_CHOICES = [
  { href: "/sell/estimate", title: "바로 판매" },
  { href: "/sell/consignment", title: "위탁 판매" },
] as const;

export function SellTradeCTA() {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [quoted, setQuoted] = useState(false);

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
    <section className="bg-[#F7F7F7] dark:bg-muted">
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
            사진 한 장이면, 지금 팔 수 있는 가격을 알려드려요
          </h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
            브랜드와 상품을 확인해 예상 판매가를 빠르게 안내해드려요.
          </p>
        </div>

        <div className="mx-auto mt-7 max-w-[880px] rounded-[24px] bg-white px-5 py-6 dark:bg-card md:mt-8 md:px-8 md:py-8">
          <div className="grid items-stretch gap-6 md:grid-cols-2 md:gap-8">
            <div className="min-w-0">
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
                  "flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed px-6 text-center transition-colors md:min-h-[300px]",
                  dragging
                    ? "border-foreground bg-[#F7F7F7] dark:bg-muted"
                    : photoUrl
                      ? "border-transparent bg-[#F7F7F7] dark:bg-muted"
                      : "border-[#D9D9D9] bg-transparent hover:border-[#B5B5B5] hover:bg-[#FAFAFA] dark:border-border dark:hover:bg-muted"
                )}
              >
                {photoUrl ? (
                  <span className="flex w-full flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt="업로드한 명품 사진"
                      className="max-h-[220px] w-auto object-contain md:max-h-[240px]"
                    />
                    <span className="mt-4 text-[13px] font-medium text-[#8B8B8B] dark:text-muted-foreground">
                      다른 사진으로 바꾸기
                    </span>
                  </span>
                ) : (
                  <>
                    <span className="text-[18px] font-bold tracking-tight text-foreground md:text-[20px]">
                      + 사진 올리기
                    </span>
                    <span className="mt-2 text-[13px] leading-5 text-[#8B8B8B] dark:text-muted-foreground">
                      가방 · 시계 · 주얼리 · 지갑 등
                    </span>
                  </>
                )}
              </label>
            </div>

            <div className="flex min-h-[240px] flex-col justify-center rounded-[20px] bg-[#F7F7F7] px-6 py-7 dark:bg-muted md:min-h-[300px] md:px-8">
              <p className="text-[11px] font-medium tracking-[0.04em] text-[#B0B0B0] dark:text-muted-foreground">
                예시
              </p>
              <p className="mt-3 text-[15px] font-semibold tracking-tight text-foreground md:text-[16px]">
                {PREVIEW.name}
              </p>
              <p className="mt-6 text-[13px] font-medium text-[#8B8B8B] dark:text-muted-foreground">
                예상 판매가
              </p>
              <p className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight text-foreground tabular-nums md:text-[30px]">
                {PREVIEW.price}
              </p>
              <p className="mt-3 text-[12px] leading-5 text-[#8B8B8B] dark:text-muted-foreground">
                {PREVIEW.note}
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-[12px] leading-5 tracking-tight text-[#B0B0B0] md:mt-7">
            {STEPS.map((label, index) => {
              const step = index + 1;
              return (
                <span key={label}>
                  {index > 0 ? <span className="mx-1.5 text-[#D0D0D0]">→</span> : null}
                  <span className={cn(activeStep === step ? "text-[#8B8B8B]" : undefined)}>
                    {String(step).padStart(2, "0")} {label}
                  </span>
                </span>
              );
            })}
          </p>

          <AnimatePresence initial={false}>
            {quoted ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-5 border-t border-[#F0F0F0] pt-5 dark:border-border"
              >
                <p className="text-center text-[13px] leading-5 text-[#8B8B8B] dark:text-muted-foreground">
                  사진을 확인했어요. 이어서 판매 방식을 선택할 수 있어요.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {SELL_CHOICES.map((choice) => (
                    <Link
                      key={choice.href}
                      href={choice.href}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-[#F7F7F7] text-[14px] font-semibold text-foreground transition-colors hover:bg-[#F0F0F0] dark:bg-muted dark:hover:bg-secondary"
                    >
                      {choice.title}
                    </Link>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleCta}
            className="inline-flex h-12 w-full max-w-[360px] items-center justify-center rounded-full bg-foreground px-7 text-[15px] font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            내 명품 시세 확인하기
          </button>
          <Link
            href="/sell"
            className="text-[13px] font-medium text-[#8B8B8B] transition-colors hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
          >
            판매 방법 전체 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
