"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

export const INSTANT_ADMIN_PATHS = [
  "/admin",
  "/admin/products",
  "/admin/products/new",
  "/admin/users",
  "/admin/orders",
  "/admin/sell",
  "/admin/coupons",
  "/admin/points",
  "/admin/faq",
  "/admin/notifications",
  "/admin/hero",
  "/admin/home-sections",
  "/admin/banner",
  "/admin/categories",
] as const;

const instantAdminPathSet = new Set<string>(INSTANT_ADMIN_PATHS);

export function isInstantAdminPath(pathname: string) {
  return instantAdminPathSet.has(pathname);
}

type AdminNavContextValue = {
  view: string;
  show: (pathname: string) => void;
};

const AdminNavContext = createContext<AdminNavContextValue | null>(null);

export function useAdminNav() {
  const value = useContext(AdminNavContext);
  const pathname = usePathname() ?? "/admin";

  if (!value) {
    return {
      view: pathname,
      show: () => {},
    };
  }

  return value;
}

export function AdminNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const pendingRef = useRef<string | null>(null);
  const [view, setView] = useState(pathname);

  const show = useCallback((nextPath: string) => {
    if (!isInstantAdminPath(nextPath)) {
      return;
    }

    pendingRef.current = nextPath;
    setView(nextPath);
  }, []);

  useEffect(() => {
    if (pendingRef.current) {
      if (pathname === pendingRef.current || !isInstantAdminPath(pathname)) {
        pendingRef.current = null;
        setView(pathname);
      }
      return;
    }

    setView(pathname);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || !isInstantAdminPath(url.pathname)) {
        return;
      }

      show(url.pathname);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [show]);

  const value = useMemo(() => ({ view, show }), [view, show]);

  return <AdminNavContext.Provider value={value}>{children}</AdminNavContext.Provider>;
}
