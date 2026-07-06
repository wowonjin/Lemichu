"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const routesToPrefetch = [
  "/new-arrivals",
  "/ranking",
  "/brand",
  "/threads",
  "/pre-owned",
  "/promotions",
  "/sale",
  "/events",
  "/search",
  "/wishlist",
  "/cart",
  "/my",
  "/sell",
];

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const prefetchRoutes = () => {
      routesToPrefetch.forEach((href) => {
        router.prefetch(href);
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetchRoutes, { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(prefetchRoutes, 1000);
    return () => globalThis.clearTimeout(timeoutId);
  }, [router]);

  return null;
}
