import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sellSteps } from "@/data/campaigns";

function SellStepGraphic({ step }: { step: number }) {
  if (step === 1) {
    return (
      <svg viewBox="0 0 80 52" aria-hidden className="h-12 w-20 text-gold">
        <rect x="8" y="12" width="48" height="32" rx="8" fill="currentColor" opacity="0.14" />
        <path d="M19 20h26M19 28h18M19 36h12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="58" cy="18" r="10" fill="white" />
        <path d="M54 18l3 3 7-8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (step === 2) {
    return (
      <svg viewBox="0 0 80 52" aria-hidden className="h-12 w-20 text-gold">
        <path d="M12 38h56" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.35" />
        <rect x="18" y="24" width="8" height="14" rx="3" fill="currentColor" opacity="0.22" />
        <rect x="34" y="16" width="8" height="22" rx="3" fill="currentColor" opacity="0.3" />
        <rect x="50" y="9" width="8" height="29" rx="3" fill="currentColor" opacity="0.42" />
        <path d="M18 18c13 1 25-3 38-12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (step === 3) {
    return (
      <svg viewBox="0 0 80 52" aria-hidden className="h-12 w-20 text-gold">
        <rect x="10" y="17" width="34" height="21" rx="5" fill="currentColor" opacity="0.16" />
        <path d="M44 23h12l8 8v7H44V23Z" fill="currentColor" opacity="0.2" />
        <path d="M16 38h48" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="24" cy="39" r="4" fill="white" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="56" cy="39" r="4" fill="white" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 80 52" aria-hidden className="h-12 w-20 text-gold">
      <rect x="18" y="10" width="44" height="34" rx="9" fill="currentColor" opacity="0.16" />
      <path d="M28 25l8 8 17-18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 39h30" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export function SellTradeCTA() {
  return (
    <section className="bg-[#f7f8f9]">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.4fr] md:items-center">
          <div>
            <h2 className="text-balance font-serif text-2xl font-semibold leading-snug text-foreground md:text-3xl">
              집에 잠든 명품,
              <br />
              지금 시세를 확인해보세요
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              사진만 올리면 예상 판매가를 안내해드립니다.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="gold">
                <Link href="/sell">
                  내 명품 시세 확인하기
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
              >
                <Link href="/sell/guide">판매 절차 보기</Link>
              </Button>
            </div>
          </div>

          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sellSteps.map((step) => (
              <li
                key={step.step}
                className="rounded-2xl bg-background p-5"
              >
                <SellStepGraphic step={step.step} />
                <p className="mt-4 text-sm font-semibold text-foreground">{step.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
