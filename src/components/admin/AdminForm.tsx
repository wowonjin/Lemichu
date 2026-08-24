import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AdminField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm font-medium text-foreground", className)}>
      {label}
      {children}
    </label>
  );
}

export const adminInputClass =
  "h-10 rounded-md border border-border bg-background px-3 text-sm font-normal text-foreground outline-none";

export const adminTextareaClass =
  "min-h-28 rounded-md border border-border bg-background px-3 py-2 text-sm font-normal text-foreground outline-none";

export function AdminPanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
