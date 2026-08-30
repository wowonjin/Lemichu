"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/home/section-motion";
import { KoboyoIcon, type KoboyoIconName } from "@/components/icons/KoboyoIcon";
import { cn } from "@/lib/cn";
import { homeFaqItems } from "@/data/homeContent";

const trustCards: {
  id: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  icon: KoboyoIconName;
}[] = [
  {
    id: "01",
    title: "정품 검수",
    description: "전문 검수 후 합격한 상품만 출고",
    href: "/authentication",
    linkLabel: "검수 기준 자세히 보기",
    icon: "magnifying-glass",
  },
  {
    id: "02",
    title: "가품 보상",
    description: "가품 판정 시 구매자를 보호하는 보상 정책",
    href: "/policy/guarantee",
    linkLabel: "보상 정책 확인",
    icon: "shield-check",
  },
  {
    id: "03",
    title: "배송 · 교환 · 반품",
    description: "배송 일정과 반품 가능 조건을 구매 전에 확인",
    href: "/policy/delivery",
    linkLabel: "배송·반품 기준 보기",
    icon: "truck",
  },
];

export function HomeFaqSection() {
  return (
    <section className="bg-background" aria-labelledby="trust-heading">
      <div className="container home-section">
        <Reveal className="flex items-start justify-between gap-3">
          <div className="min-w-0 max-w-2xl">
            <h2 id="trust-heading" className="home-title">
              명품이니까, 구매 전 더 꼼꼼하게
            </h2>
            <p className="home-desc">
              검수부터 보상, 배송·반품까지 구매 전에 확인해보세요.
            </p>
          </div>

          <Link
            href="/faq"
            className="home-more mt-1"
          >
            FAQ 전체보기
            <ChevronRight className="size-4" />
          </Link>
        </Reveal>

        <Stagger
          stagger={0.1}
          delay={0.08}
          className="mt-5 grid grid-cols-1 gap-2 md:mt-8 md:grid-cols-3 md:gap-4"
        >
          {trustCards.map((card) => (
            <StaggerItem key={card.id} variant="up" className="h-full">
            <Link
              href={card.href}
              className="group flex h-full flex-col rounded-md bg-[#F7F7F7] px-4 py-4 transition-colors duration-300 hover:bg-[#F0F0F0] dark:bg-muted dark:hover:bg-secondary md:min-h-[236px] md:px-7 md:py-7"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex text-foreground">
                  <KoboyoIcon name={card.icon} className="size-7" />
                </span>
                <span className="text-[12px] font-bold tabular-nums tracking-tight text-[#B0B0B0] dark:text-muted-foreground">
                  {card.id}
                </span>
              </div>

              <h3 className="mt-3 text-[16px] font-bold tracking-tight text-foreground md:mt-6 md:text-[20px]">
                {card.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-5 text-[#8B8B8B] dark:text-muted-foreground md:mt-2 md:text-[14px] md:leading-6">
                {card.description}
              </p>

              <span className="mt-auto inline-flex items-center pt-4 text-[13px] font-medium text-foreground md:pt-6">
                {card.linkLabel}
                <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
            </StaggerItem>
          ))}
        </Stagger>

        <Stagger
          stagger={0.05}
          delay={0.06}
          className="mt-8 border-t border-[#EEEEEE] dark:border-border md:mt-10"
        >
          {homeFaqItems.map((item) => (
            <StaggerItem key={item.q} variant="soft">
              <FaqRow question={item.q} answer={item.a} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function FaqRow({ question, answer }: { question: string; answer: string }) {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#EEEEEE] dark:border-border">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-3.5 text-left text-[14px] font-medium text-foreground md:py-4 md:text-[15px]"
      >
        {question}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#8B8B8B] transition-transform duration-300 ease-out dark:text-muted-foreground",
            open && "rotate-180"
          )}
        />
      </button>
      <motion.div
        id={panelId}
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="pb-4 pr-8 text-[13px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[14px]">
          {answer}
        </p>
      </motion.div>
    </div>
  );
}
