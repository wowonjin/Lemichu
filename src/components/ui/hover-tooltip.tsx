import { cn } from "@/lib/cn";

const surfaceClassName =
  "whitespace-nowrap rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-semibold text-foreground shadow-[0_6px_18px_rgba(15,23,42,0.1)] dark:bg-card dark:shadow-[0_8px_22px_rgba(0,0,0,0.45)]";

export function HoverTooltip({
  label,
  placement = "bottom",
  className,
}: {
  label: string;
  placement?: "bottom" | "left";
  className?: string;
}) {
  if (placement === "left") {
    return (
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute right-full top-1/2 mr-2.5 -translate-y-1/2 translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100",
          surfaceClassName,
          className
        )}
      >
        {label}
        <span
          aria-hidden
          className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-white dark:border-l-card"
        />
      </span>
    );
  }

  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 translate-y-1 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
        surfaceClassName,
        className
      )}
    >
      {label}
      <span
        aria-hidden
        className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-white dark:border-b-card"
      />
    </span>
  );
}
