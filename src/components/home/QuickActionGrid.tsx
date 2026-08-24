import Link from "next/link";
import { quickActions } from "@/data/campaigns";

export function QuickActionGrid() {
  return (
    <section className="container py-8 md:py-10">
      <ul className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
        {quickActions.map((action) => (
          <li key={action.id}>
            <Link
              href={action.href}
              className="group flex h-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-background px-2 py-5 text-center transition-colors hover:border-foreground/20 hover:bg-secondary md:py-6"
            >
              <span className="grid size-11 place-items-center rounded-md bg-secondary text-foreground transition-colors group-hover:bg-gold-soft md:size-12">
                <action.icon className="size-5 md:size-[22px]" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-foreground md:text-sm">
                  {action.label}
                </p>
                <p className="mt-0.5 hidden text-[11px] text-muted-foreground md:block">
                  {action.description}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
