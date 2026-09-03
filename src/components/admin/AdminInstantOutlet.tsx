"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { isInstantAdminPath, useAdminNav } from "@/components/admin/admin-nav-context";

const ADMIN_PAGE_LOADERS: Record<string, () => Promise<ComponentType>> = {
  "/admin": () => import("@/components/admin/AdminDashboard").then((mod) => mod.AdminDashboard),
  "/admin/products": () =>
    import("@/components/admin/AdminProductsPage").then((mod) => mod.AdminProductsPage),
  "/admin/products/new": () =>
    import("@/components/admin/AdminProductsPage").then((mod) => mod.AdminProductCreatePage),
  "/admin/users": () => import("@/components/admin/AdminUsersPage").then((mod) => mod.AdminUsersPage),
  "/admin/orders": () => import("@/components/admin/AdminOrdersPage").then((mod) => mod.AdminOrdersPage),
  "/admin/sell": () =>
    import("@/components/admin/AdminSellManagePage").then((mod) => mod.AdminSellManagePage),
  "/admin/coupons": () =>
    import("@/components/admin/AdminCouponsPage").then((mod) => mod.AdminCouponsPage),
  "/admin/points": () => import("@/components/admin/AdminPointsPage").then((mod) => mod.AdminPointsPage),
  "/admin/faq": () =>
    import("@/components/admin/AdminFaqManagePage").then((mod) => mod.AdminFaqManagePage),
  "/admin/notifications": () =>
    import("@/components/admin/AdminNotificationsPage").then((mod) => mod.AdminNotificationsManagePage),
  "/admin/hero": () =>
    import("@/components/admin/AdminHeroSlidesPage").then((mod) => mod.AdminHeroSlidesPage),
  "/admin/home-sections": () =>
    import("@/components/admin/AdminHomeSectionsPage").then((mod) => mod.AdminHomeSectionsPage),
  "/admin/banner": () => import("@/components/admin/AdminBannerPage").then((mod) => mod.AdminBannerPage),
  "/admin/categories": () =>
    import("@/components/admin/AdminCategoriesPage").then((mod) => mod.AdminCategoriesPage),
};

export function AdminInstantOutlet({ children }: { children: ReactNode }) {
  const { view } = useAdminNav();
  const [registry, setRegistry] = useState<Record<string, ComponentType>>({});
  const [visited, setVisited] = useState<string[]>(() => (isInstantAdminPath(view) ? [view] : []));

  useEffect(() => {
    if (!isInstantAdminPath(view)) {
      return;
    }

    setVisited((current) => (current.includes(view) ? current : [...current, view]));
  }, [view]);

  useEffect(() => {
    if (!isInstantAdminPath(view)) {
      return;
    }

    const loader = ADMIN_PAGE_LOADERS[view];
    if (!loader) {
      return;
    }

    let cancelled = false;
    void loader().then((Page) => {
      if (!cancelled) {
        setRegistry((current) => (current[view] ? current : { ...current, [view]: Page }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [view]);

  const mounted = isInstantAdminPath(view) ? Array.from(new Set([...visited, view])) : visited;
  const activePageReady = !isInstantAdminPath(view) || Boolean(registry[view]);

  return (
    <>
      {mounted.map((href) => {
        const Page = registry[href];
        if (!Page) {
          return null;
        }

        const active = href === view;
        return (
          <div key={href} hidden={!active} inert={!active}>
            <Page />
          </div>
        );
      })}
      {activePageReady ? null : (
        <div className="h-32 animate-pulse rounded-xl bg-secondary" />
      )}
      {isInstantAdminPath(view) ? null : children}
    </>
  );
}
