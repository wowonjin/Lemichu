"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { brands } from "@/data/brands";

const MAX = 5;

export function InterestBrandPicker({
  className,
}: {
  className?: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX) return prev;
      return [...prev, id];
    });
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">관심 브랜드 선택</p>
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-gold">{selected.length}</span> / {MAX}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        최대 {MAX}개까지 선택할 수 있어요. 관심 브랜드의 신상품과 가격 인하 소식을
        받아보세요.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {brands.map((brand) => {
          const active = selected.includes(brand.id);
          const disabled = !active && selected.length >= MAX;
          return (
            <button
              key={brand.id}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => toggle(brand.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground/80 hover:border-foreground/30",
                disabled && "cursor-not-allowed opacity-40 hover:border-border"
              )}
            >
              {active ? <Check className="size-3" /> : null}
              {brand.wordmark}
            </button>
          );
        })}
      </div>
    </div>
  );
}
