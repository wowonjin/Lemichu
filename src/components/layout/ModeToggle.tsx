"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { toggleSearchUsedHref } from "@/lib/search/url";

const pillTransition = { type: "spring" as const, stiffness: 420, damping: 36 };

export function ModeToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const isSearch = pathname === "/search";
  const isPreOwned = pathname.startsWith("/pre-owned") || (isSearch && searchParams.get("used") === "1");
  const [usedSelected, setUsedSelected] = useState(isPreOwned);
  const allHref = isSearch ? toggleSearchUsedHref(searchParams.toString(), false) : "/";
  const usedHref = isSearch ? toggleSearchUsedHref(searchParams.toString(), true) : "/pre-owned";

  useEffect(() => {
    setUsedSelected(isPreOwned);
  }, [isPreOwned]);

  return (
    <div className="relative grid grid-cols-2 items-center rounded-md bg-secondary p-0.5 text-xs font-semibold">
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-foreground"
        initial={false}
        animate={{ x: usedSelected ? "100%" : "0%" }}
        transition={reduceMotion ? { duration: 0 } : pillTransition}
      />
      <Link
        href={allHref}
        aria-current={!usedSelected ? "page" : undefined}
        onClick={() => setUsedSelected(false)}
        className={cn(
          "relative z-10 rounded-md px-2.5 py-1 text-center transition-colors duration-300",
          !usedSelected ? "text-background" : "text-muted-foreground"
        )}
      >
        전체
      </Link>
      <Link
        href={usedHref}
        aria-current={usedSelected ? "page" : undefined}
        onClick={() => setUsedSelected(true)}
        className={cn(
          "relative z-10 rounded-md px-2.5 py-1 text-center transition-colors duration-300",
          usedSelected ? "text-background" : "text-muted-foreground"
        )}
      >
        중고
      </Link>
    </div>
  );
}
