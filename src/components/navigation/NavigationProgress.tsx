"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isInternalNavigation(anchor: HTMLAnchorElement) {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) {
    return false;
  }

  return url.pathname + url.search !== window.location.pathname + window.location.search;
}

function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const pendingRef = useRef(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor || !isInternalNavigation(anchor)) {
        return;
      }

      pendingRef.current = true;
      setVisible(true);
      setWidth(16);
      window.requestAnimationFrame(() => setWidth(70));
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!pendingRef.current) {
      return;
    }

    pendingRef.current = false;
    setWidth(100);
    const hideId = window.setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 200);

    return () => window.clearTimeout(hideId);
  }, [pathname, searchParams]);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-0.5 bg-transparent">
      <div
        className="h-full bg-foreground transition-[width] duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  );
}
