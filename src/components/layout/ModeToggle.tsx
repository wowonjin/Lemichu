"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function ModeToggle() {
  const pathname = usePathname();
  const isPreOwned = pathname.startsWith("/pre-owned");

  return (
    <div className="flex items-center rounded-full bg-secondary p-0.5 text-xs font-semibold">
      <Link
        href="/"
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          !isPreOwned ? "bg-foreground text-background" : "text-muted-foreground"
        )}
      >
        전체
      </Link>
      <Link
        href="/pre-owned"
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          isPreOwned ? "bg-foreground text-background" : "text-muted-foreground"
        )}
      >
        중고
      </Link>
    </div>
  );
}
