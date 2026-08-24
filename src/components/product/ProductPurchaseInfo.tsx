"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function ProductPurchaseInfo({
  rows,
}: {
  rows: Array<[string, string]>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-5 border-t border-[#E8E8E8] pt-4 dark:border-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-[13px] font-semibold text-foreground"
      >
        배송·혜택 정보
        <ChevronDown
          className={cn(
            "size-4 text-[#8B8B8B] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:text-muted-foreground",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <dl className="space-y-3 pt-4 text-[13px]">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[76px_minmax(0,1fr)] gap-3">
                <dt className="text-[#8B8B8B] dark:text-muted-foreground">{label}</dt>
                <dd className="font-medium leading-5 text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
