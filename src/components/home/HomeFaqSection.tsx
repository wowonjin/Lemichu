import Link from "next/link";
import { ChevronDown, ChevronRight, ScanLine, ShieldCheck, Truck } from "lucide-react";
import { homeFaqItems } from "@/data/homeContent";

const trustCards = [
  {
    id: "01",
    title: "정품 검수",
    description: "전문 검수 후 합격한 상품만 출고",
    href: "/authentication",
    linkLabel: "검수 기준 자세히 보기",
    icon: ScanLine,
  },
  {
    id: "02",
    title: "가품 보상",
    description: "가품 판정 시 구매자를 보호하는 보상 정책",
    href: "/policy/guarantee",
    linkLabel: "보상 정책 확인",
    icon: ShieldCheck,
  },
  {
    id: "03",
    title: "배송 · 교환 · 반품",
    description: "배송 일정과 반품 가능 조건을 구매 전에 확인",
    href: "/policy/delivery",
    linkLabel: "배송·반품 기준 보기",
    icon: Truck,
  },
] as const;

export function HomeFaqSection() {
  return (
    <section className="bg-background" aria-labelledby="trust-heading">
      <div className="container py-12 md:py-16">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <h2
              id="trust-heading"
              className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]"
            >
              명품이니까, 구매 전 더 꼼꼼하게
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
              검수부터 보상, 배송·반품까지 구매 전에 확인해보세요.
            </p>
          </div>

          <Link
            href="/faq"
            className="mt-1.5 inline-flex shrink-0 items-center text-[13px] font-medium text-[#8B8B8B] transition-colors hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground md:text-[14px]"
          >
            FAQ 전체보기
            <ChevronRight className="size-4" />
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 md:mt-8 md:grid-cols-3 md:gap-4">
          {trustCards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="group flex flex-col rounded-[20px] bg-[#F7F7F7] px-6 py-6 transition-colors duration-300 hover:bg-[#F0F0F0] dark:bg-muted dark:hover:bg-secondary md:min-h-[236px] md:px-7 md:py-7"
            >
              <div className="flex items-start justify-between gap-4">
                <card.icon
                  className="size-5 text-foreground"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="text-[12px] font-bold tabular-nums tracking-tight text-[#B0B0B0] dark:text-muted-foreground">
                  {card.id}
                </span>
              </div>

              <h3 className="mt-6 text-[18px] font-bold tracking-tight text-foreground md:text-[20px]">
                {card.title}
              </h3>
              <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
                {card.description}
              </p>

              <span className="mt-auto inline-flex items-center pt-6 text-[13px] font-medium text-foreground">
                {card.linkLabel}
                <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 border-t border-[#EEEEEE] dark:border-border md:mt-10">
          {homeFaqItems.map((item) => (
            <details
              key={item.q}
              className="group border-b border-[#EEEEEE] dark:border-border"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-left text-[14px] font-medium text-foreground md:py-4 md:text-[15px] [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-[#8B8B8B] transition-transform duration-200 group-open:rotate-180 dark:text-muted-foreground" />
              </summary>
              <p className="pb-4 pr-8 text-[13px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[14px]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
