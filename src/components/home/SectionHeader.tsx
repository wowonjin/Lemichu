import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function SectionHeader({
  eyebrow,
  title,
  description,
  moreHref,
  moreLabel = "더보기",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  moreHref?: string;
  moreLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0 space-y-1">
        {eyebrow ? (
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold md:text-xs">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="home-title">
          {title}
        </h2>
        {description ? (
          <p className="home-desc">{description}</p>
        ) : null}
      </div>

      {moreHref ? (
        <Link
          href={moreHref}
          className="home-more group"
        >
          {moreLabel}
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
