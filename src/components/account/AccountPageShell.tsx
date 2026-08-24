"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import { ACCOUNT_NAV, getAccountNavKey } from "@/lib/accountNav";
import { getLoginHref } from "@/lib/redirect";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Sheet } from "@/components/ui/sheet";

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const activeKey = getAccountNavKey(pathname);

  return (
    <nav className={cn("space-y-4", className)} aria-label="마이페이지 메뉴">
      {ACCOUNT_NAV.map((group) => (
        <div key={group.title}>
          <p className="px-2 text-[12px] font-semibold tracking-tight text-muted-foreground">
            {group.title}
          </p>
          <ul className="mt-1">
            {group.items.map((item) => {
              const active = item.key === activeKey;
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-8 items-center gap-2.5 rounded-md px-2 text-[14px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                      active
                        ? "bg-secondary font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.8} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarProfile() {
  const { user, ready } = useAuthUser();

  if (!ready) {
    return <div className="mb-6 h-14 animate-pulse rounded-md bg-secondary" />;
  }

  const displayName = user?.name?.trim() || "로그인";

  return (
    <Link
      href={user ? "/my/settings" : getLoginHref("/my")}
      className="mb-6 block rounded-md bg-secondary px-3 py-3 transition-colors hover:bg-secondary/80"
    >
      <p className="truncate text-[15px] font-bold tracking-tight text-foreground">
        {user ? `${displayName}님` : "로그인이 필요해요"}
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {user ? user.email : "계정 정보를 확인하려면 로그인하세요"}
      </p>
    </Link>
  );
}

export function AccountPageShell({
  children,
  currentLabel,
}: {
  children: ReactNode;
  currentLabel?: string;
}) {
  const pathname = usePathname() ?? "/my";
  const [menuOpen, setMenuOpen] = useState(false);
  const activeKey = getAccountNavKey(pathname);
  const activeLabel =
    currentLabel ??
    ACCOUNT_NAV.flatMap((group) => group.items).find((item) => item.key === activeKey)?.label ??
    "마이페이지";

  return (
    <div className="bg-background">
      <div className="container pb-20 pt-8 md:pt-10">
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <p className="text-[20px] font-bold tracking-tight text-foreground">마이페이지</p>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <Menu className="size-4" />
            메뉴
            <span className="sr-only">현재 페이지 {activeLabel}</span>
          </button>
        </div>

        <div className="flex items-start gap-8 lg:gap-10">
          <aside className="sticky top-28 hidden w-[232px] shrink-0 lg:block">
            <SidebarProfile />
            <NavLinks pathname={pathname} />
          </aside>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>

      <div className="lg:hidden">
        <Sheet
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          title="마이페이지 메뉴"
          side="bottom"
          panelClassName="shadow-none"
        >
          <div className="px-5 py-5">
            <SidebarProfile />
            <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          </div>
        </Sheet>
      </div>
    </div>
  );
}

export function AccountSection({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-md bg-secondary px-5 py-5 md:px-6 md:py-6",
        className
      )}
    >
      {title ? (
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-[17px] font-bold tracking-tight text-foreground">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AccountEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <p className="text-[17px] font-bold tracking-tight text-foreground">{title}</p>
      {description ? (
        <p className="max-w-md text-[14px] leading-6 text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function AccountErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <p className="text-[15px] text-foreground">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          다시 시도
        </button>
      ) : null}
    </div>
  );
}

export function AccountSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 py-1" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-20 rounded-2xl bg-secondary" />
      ))}
    </div>
  );
}

export function AccountCtaLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        variant === "primary"
          ? "bg-foreground text-background hover:bg-foreground/90"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
