"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { toggleSearchUsedHref } from "@/lib/search/url";

const pillTransition = { type: "spring" as const, stiffness: 420, damping: 36 };

export function ModeToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const isSearch = pathname === "/search";
  const usedHref = isSearch ? toggleSearchUsedHref(searchParams.toString(), true) : "/products";

  return (
    <div className="relative grid grid-cols-2 items-center rounded-md bg-secondary p-0.5 text-[11px] font-semibold md:text-xs">
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-foreground"
        initial={false}
        animate={{ x: "100%" }}
        transition={reduceMotion ? { duration: 0 } : pillTransition}
      />
      <span
        aria-disabled="true"
        className="relative z-10 cursor-not-allowed rounded-md px-1.5 py-0.5 text-center text-muted-foreground md:px-2.5 md:py-1"
      >
        전체
      </span>
      <Link
        href={usedHref}
        aria-current="page"
        className="relative z-10 rounded-md px-1.5 py-0.5 text-center text-background transition-colors duration-300 md:px-2.5 md:py-1"
      >
        중고
      </Link>
    </div>
  );
}
