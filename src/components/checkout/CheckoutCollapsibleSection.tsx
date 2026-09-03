"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function CheckoutCollapsibleSection({
  title,
  open,
  onToggle,
  children,
  className,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        // Keep closed cards clipped for rounded corners; open cards must not
        // clip in-section dropdowns (e.g. 배송 요청사항).
        open ? "overflow-visible" : "overflow-hidden",
        "rounded-[16px] border border-[#E5E8EB] bg-background shadow-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left md:px-5"
      >
        <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#191F28]">
          {title}
        </h2>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-[#8B95A1] transition-transform duration-200",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-[#F2F4F6] px-4 pb-5 pt-4 md:px-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}
