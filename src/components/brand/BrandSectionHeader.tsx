import type { ReactNode } from "react";

export function BrandSectionHeader({
  title,
  description,
  aside,
  titleId,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  titleId?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 max-w-[640px]">
        <h2
          id={titleId}
          className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0 pt-1.5">{aside}</div> : null}
    </div>
  );
}
