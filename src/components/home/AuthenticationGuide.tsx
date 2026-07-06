import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { authSteps } from "@/data/campaigns";

function AuthStepGraphic({ id }: { id: string }) {
  if (id === "expert") {
    return (
      <svg viewBox="0 0 80 52" aria-hidden className="h-12 w-20 text-gold">
        <circle cx="31" cy="24" r="13" fill="currentColor" opacity="0.16" />
        <path d="M41 34l12 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M25 24l5 5 9-12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === "grade") {
    return (
      <svg viewBox="0 0 80 52" aria-hidden className="h-12 w-20 text-gold">
        <rect x="14" y="13" width="52" height="30" rx="8" fill="currentColor" opacity="0.14" />
        <path d="M25 34h30M25 26h22M25 18h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M56 16l2 4 4 .5-3 3 .8 4-3.8-2-3.8 2 .8-4-3-3 4-.5 2-4Z" fill="currentColor" />
      </svg>
    );
  }

  if (id === "serial") {
    return (
      <svg viewBox="0 0 80 52" aria-hidden className="h-12 w-20 text-gold">
        <rect x="16" y="11" width="48" height="34" rx="7" fill="currentColor" opacity="0.14" />
        <path d="M25 20h30M25 28h8M39 28h5M50 28h5M25 36h20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "report") {
    return (
      <svg viewBox="0 0 80 52" aria-hidden className="h-12 w-20 text-gold">
        <path d="M25 8h23l9 9v27H25V8Z" fill="currentColor" opacity="0.14" />
        <path d="M48 8v10h10" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M32 25h16M32 33h20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 80 52" aria-hidden className="h-12 w-20 text-gold">
      <path d="M40 8l22 8v13c0 13-9 20-22 23-13-3-22-10-22-23V16l22-8Z" fill="currentColor" opacity="0.14" />
      <path d="M30 28l7 7 14-17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AuthenticationGuide() {
  return (
    <section className="bg-[#f7f8f9]">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-[0.85fr_1.4fr] md:items-end">
          <div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              안심하고 구매하세요
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              검수부터 보상까지, 필요한 기준만 남겼습니다.
            </p>
          </div>

          <Link
            href="/authentication"
            className="inline-flex items-center gap-1 justify-self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:justify-self-end"
          >
            검수 기준 보기
            <ChevronRight className="size-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {authSteps.map((step) => (
            <div key={step.id} className="rounded-2xl bg-background p-5">
              <AuthStepGraphic id={step.id} />
              <h3 className="mt-4 text-sm font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
