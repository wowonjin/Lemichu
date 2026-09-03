"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Home,
  LayoutGrid,
  LogIn,
  PackageCheck,
  PlusCircle,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useAdminNav } from "@/components/admin/admin-nav-context";
import { AppearanceSwitch } from "@/components/theme/AppearanceSwitch";
import { observeAuthUser, isAdminUser, readAuthUser, type AuthUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { getLoginHref } from "@/lib/redirect";

type AdminNavIcon = ComponentType<{ className?: string }>;

type AdminNavLink = {
  label: string;
  href: string;
  icon: AdminNavIcon;
  exact?: boolean;
};

const dashboardNavItem = {
  label: "대시보드",
  href: "/admin",
  icon: Home,
  exact: true,
} satisfies AdminNavLink;

const adminNavItems: readonly AdminNavLink[] = [
  dashboardNavItem,
  { label: "상품 목록", href: "/admin/products", icon: ShoppingBag, exact: true },
  { label: "신규 상품 등록", href: "/admin/products/new", icon: PlusCircle },
  { label: "주문 관리", href: "/admin/orders", icon: PackageCheck },
];

function isNavItemActive(pathname: string, item: AdminNavLink) {
  if (item.href === "/admin" || item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { view } = useAdminNav();
  const loginHref = getLoginHref(pathname);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = readAuthUser();
    if (stored) {
      setAuthUser(stored);
      setIsReady(true);
    }

    return observeAuthUser((user) => {
      setAuthUser(user);
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary p-6">
        <div className="rounded-2xl border border-border bg-background px-8 py-6 text-center text-sm text-muted-foreground shadow-sm">
          관리자 권한을 확인하는 중입니다.
        </div>
      </div>
    );
  }

  if (!isAdminUser(authUser)) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary p-6">
        <section className="w-full max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gold-soft text-foreground">
            <LogIn className="size-6" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            관리자 로그인이 필요합니다
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            임시 관리자 계정으로 로그인하면 관리자 페이지에 접근할 수 있어요.
          </p>
          <Link
            href={loginHref}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            로그인하러 가기
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background text-foreground lg:flex">
      <aside className="sticky top-0 z-40 hidden h-svh w-64 shrink-0 flex-col border-r border-border bg-secondary/40 lg:flex">
        <div className="flex h-16 shrink-0 items-center px-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LEMICHU" className="h-5 w-auto dark:invert" />
          </Link>
        </div>

        <div className="shrink-0 px-3 pb-4">
          <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground">
            <Search className="size-4 shrink-0" />
            <span className="truncate">회원, 주문, 상품을 빠르게 확인하세요</span>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-5" aria-label="관리자 메뉴">
          <div className="space-y-1">
            {adminNavItems.map((item) => {
              const active = isNavItemActive(view, item);
              const ItemIcon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <ItemIcon className="size-[18px] shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 space-y-2 p-3">
          <AppearanceSwitch className="w-full" />
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <ExternalLink className="size-4" />
            사이트 보기
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-secondary text-foreground">
                <LayoutGrid className="size-4" />
              </span>
              <Link href="/" className="inline-flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="LEMICHU" className="h-5 w-auto dark:invert" />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <AppearanceSwitch className="w-36" />
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                <ExternalLink className="size-3.5" />
                사이트
              </Link>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
            {adminNavItems.map((item) => {
              const active = isNavItemActive(view, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={cn(
                    "shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
        {title}
      </h2>
      {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
    </div>
  );
}

export function AdminMetricCard({
  label,
  value,
  icon: Icon,
  delta,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  delta?: { value: number; label?: string } | null;
}) {
  const hasDelta = delta != null && Number.isFinite(delta.value);
  const isUp = hasDelta && delta!.value >= 0;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        {label}
      </div>
      <div className="mt-2.5 flex items-end gap-2">
        <p className="text-[28px] font-semibold leading-none tracking-tight text-foreground">
          {value}
        </p>
        {hasDelta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              isUp ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {isUp ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(delta!.value)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
