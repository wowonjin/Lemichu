"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { buildSearchHref } from "@/lib/search/url";

export function useUsedCatalogMode() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const usedOnly =
    pathname.startsWith("/products") ||
    pathname.startsWith("/pre-owned") ||
    (pathname === "/search" && searchParams.get("used") === "1");

  return {
    usedOnly,
    pathname,
    searchParams,
    searchHref: (query: string) => buildSearchHref(query, { used: usedOnly }),
  };
}
