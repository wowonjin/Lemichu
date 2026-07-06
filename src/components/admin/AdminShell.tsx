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
  Users,
} from "lucide-react";
import { observeAuthUser, isAdminUser, type AuthUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { getLoginHref } from "@/lib/redirect";

const navItems = [
  { label: "대시보드", href: "/admin", icon: Home },
  { label: "상품 관리", href: "/admin/products", icon: ShoppingBag, exact: true },
  { label: "신규 상품 등록", href: "/admin/products/new", icon: PlusCircle },
  { label: "회원 목록", href: "/admin/users", icon: Users },
  { label: "주문 관리", href: "/admin/orders", icon: PackageCheck },
];

function isNavItemActive(pathname: string, item: (typeof navItems)[number]) {
  if (item.href === "/admin" || item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const loginHref = getLoginHref(pathname);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
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
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            로그인하러 가기
          </Link>
        </section>
      </div>
    );
  }

  const adminUser = authUser;
  const initial = adminUser.name?.slice(0, 1) || adminUser.email?.slice(0, 1) || "A";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LEMICHU" className="h-5 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isNavItemActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  )}
                >
                  <item.icon className="size-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-md bg-secondary px-3 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-sm font-bold uppercase text-background">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {adminUser.name || "관리자"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{adminUser.email}</p>
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
            사이트 보기
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-secondary text-foreground lg:hidden">
                <LayoutGrid className="size-4" />
              </span>
              <div className="hidden h-10 min-w-72 items-center gap-2 rounded-md border border-border bg-secondary px-4 text-sm text-muted-foreground md:flex">
                <Search className="size-4" />
                회원, 주문, 상품을 빠르게 확인하세요
              </div>
            </div>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <ExternalLink className="size-4" />
              사이트 보기
            </Link>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar lg:hidden">
            {navItems.map((item) => {
              const active = isNavItemActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
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

        <main className="mx-auto max-w-[1400px] p-4 md:p-8">{children}</main>
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
    <div className="mb-8 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
        {title}
      </h2>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
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
