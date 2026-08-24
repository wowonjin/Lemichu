import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { authSteps } from "@/data/campaigns";

export function AuthenticationGuide() {
  return (
    <section className="bg-sand">
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
              <span className="grid size-10 place-items-center rounded-md bg-secondary">
                <step.icon className="size-[18px] text-foreground" strokeWidth={1.8} />
              </span>
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
