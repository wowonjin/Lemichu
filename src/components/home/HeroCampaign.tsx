"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LineChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTemporaryImageUrl } from "@/lib/placeholder";
import { heroCards } from "@/data/campaigns";

const cardOffsets = [
  "z-30 md:translate-x-0 md:translate-y-0",
  "z-20 md:translate-x-10 md:translate-y-14",
  "z-10 md:-translate-x-6 md:translate-y-28",
];

export function HeroCampaign() {
  return (
    <section className="relative overflow-hidden bg-sand">
      <div className="container grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-xl"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-background px-3 py-1 text-xs font-medium text-foreground">
            <ShieldCheck className="size-3.5 text-gold" />
            전문 검수팀 1:1 정품 검수
          </span>

          <h1 className="mt-5 text-balance font-serif text-3xl font-semibold leading-[1.2] tracking-tight text-foreground md:text-5xl md:leading-[1.15]">
            정품 검수 완료 명품을
            <br />
            가장 안전하게 사고파는 곳
          </h1>

          <p className="mt-4 text-balance text-sm leading-relaxed text-muted-foreground md:text-base">
            신상, 중고, 위탁판매까지. 구매 전 검수 정보와 배송 가능일을 먼저
            확인하세요.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/new-arrivals">
                지금 쇼핑하기
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sell">
                <LineChart />
                내 명품 시세 확인하기
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Stacked premium cards */}
        <div className="relative hidden h-[380px] md:block">
          {heroCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30, rotate: i === 0 ? -2 : i === 1 ? 3 : -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * i, ease: "easeOut" }}
              className={`absolute left-1/2 top-1/2 w-60 -translate-x-1/2 -translate-y-1/2 ${cardOffsets[i]}`}
            >
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getTemporaryImageUrl(card.seed)}
                  alt={`${card.brand} ${card.name}`}
                  className="aspect-square w-full bg-[#f6f7f8] object-contain p-4 mix-blend-multiply"
                />
                <div className="space-y-1 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide text-foreground">
                      {card.brand}
                    </span>
                    <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
                      {card.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{card.name}</p>
                  <p className="pt-1 text-sm font-semibold tabular-nums text-foreground">
                    {card.priceLabel}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: single hero card preview */}
        <div className="relative mx-auto w-full max-w-xs md:hidden">
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getTemporaryImageUrl(heroCards[0].seed)}
              alt={`${heroCards[0].brand} ${heroCards[0].name}`}
              className="aspect-square w-full bg-[#f6f7f8] object-contain p-5 mix-blend-multiply"
            />
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {heroCards[0].brand}
                </p>
                <p className="text-xs text-muted-foreground">
                  {heroCards[0].name}
                </p>
              </div>
              <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
                {heroCards[0].badge}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
