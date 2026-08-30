import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function CustomerPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 overflow-x-hidden bg-background", className)}>
      <div className="container min-w-0 py-5 md:py-12">{children}</div>
    </div>
  );
}

export function CustomerPageHero({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-background shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:rounded-[2rem]",
        className
      )}
    >
      <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[1.1fr_0.9fr] md:gap-8 md:p-10">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-balance font-serif text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl md:mt-4 md:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-xl text-balance text-sm leading-relaxed text-muted-foreground md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {children ? <div className="min-w-0">{children}</div> : null}
      </div>
    </section>
  );
}

export function CustomerSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-background p-4 shadow-sm md:rounded-[1.75rem] md:p-6",
        className
      )}
    >
      {children}
    </section>
  );
}

export function GoldPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md bg-gold-soft px-3 py-1 text-xs font-semibold text-foreground">
      {children}
    </span>
  );
}
