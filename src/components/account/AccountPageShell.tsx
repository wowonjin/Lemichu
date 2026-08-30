"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  ACCOUNT_NAV,
  ACCOUNT_SUBNAV,
  getAccountNavKey,
  isAccountSubNavActive,
  type AccountNavKey,
} from "@/lib/accountNav";
import { Sheet } from "@/components/ui/sheet";

const NAV_EASE = "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

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
  const panelIdPrefix = useId();
  const [openKeys, setOpenKeys] = useState<Partial<Record<AccountNavKey, boolean>>>(() =>
    activeKey && ACCOUNT_SUBNAV[activeKey] ? { [activeKey]: true } : {}
  );

  useEffect(() => {
    if (!activeKey || !ACCOUNT_SUBNAV[activeKey]) return;
    setOpenKeys((current) => (current[activeKey] ? current : { ...current, [activeKey]: true }));
  }, [activeKey]);

  const toggle = (key: AccountNavKey) => {
    setOpenKeys((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <nav className={className} aria-label="마이페이지 메뉴">
      <ul>
        {ACCOUNT_NAV.map((item) => {
          const active = item.key === activeKey;
          const Icon = item.icon;
          const subItems = ACCOUNT_SUBNAV[item.key];
          const isOpen = Boolean(openKeys[item.key]);
          const panelId = `${panelIdPrefix}-${item.key}`;

          if (subItems?.length) {
            return (
              <li key={item.key}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(item.key)}
                  className={cn(
                    "flex min-h-10 w-full items-center gap-2.5 rounded-md px-2 text-left text-[14px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                    active
                      ? "bg-secondary font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.8} />
                  <span className="flex-1">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      NAV_EASE,
                      isOpen && "rotate-180"
                    )}
                    strokeWidth={1.8}
                  />
                </button>
                <div
                  id={panelId}
                  className={cn(
                    "grid transition-[grid-template-rows]",
                    NAV_EASE,
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <ul className="overflow-hidden">
                    {subItems.map((subItem) => {
                      const subActive = isAccountSubNavActive(pathname, subItem.href);
                      return (
                        <li key={subItem.href}>
                          <Link
                            href={subItem.href}
                            onClick={onNavigate}
                            aria-current={subActive ? "page" : undefined}
                            className={cn(
                              "flex min-h-9 items-center rounded-md py-0.5 pl-9 pr-2 text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                              subActive
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                            )}
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            );
          }

          return (
            <li key={item.key}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-2.5 rounded-md px-2 text-[14px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
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
    </nav>
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
    ACCOUNT_NAV.find((item) => item.key === activeKey)?.label ??
    "마이페이지";

  return (
    <div className="bg-background">
      <div className="container min-w-0 pb-24 pt-5 md:pb-20 md:pt-10">
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <p className="text-lg font-bold tracking-tight text-foreground md:text-[20px]">마이페이지</p>
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

        <div className="flex gap-8 lg:gap-10">
          <aside className="hidden w-[232px] shrink-0 lg:block">
            <div className="sticky top-[calc(var(--header-height)+1rem)]">
              <NavLinks pathname={pathname} />
            </div>
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
  titleSize = "md",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  titleSize?: "md" | "lg";
}) {
  const Heading = titleSize === "lg" ? "h1" : "h2";

  return (
    <section className={cn("rounded-md bg-secondary px-5 py-5 md:px-6 md:py-6", className)}>
      {title ? (
        <div
          className={cn(
            "flex items-center justify-between gap-4",
            children ? "mb-5 border-b border-border pb-4" : null
          )}
        >
          <Heading
            className={cn(
              "font-bold tracking-tight text-foreground",
              titleSize === "lg" ? "text-[26px]" : "text-[17px]"
            )}
          >
            {title}
          </Heading>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AccountMoreLink({
  href,
  children = "전체보기",
}: {
  href: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 shrink-0 items-center gap-0.5 text-[14px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
      <ChevronRight className="size-4" strokeWidth={1.8} />
    </Link>
  );
}

export function AccountStatRow({
  items,
}: {
  items: Array<{
    key: string;
    label: string;
    value: ReactNode;
    unit?: string;
    href?: string;
    emphasize?: boolean;
  }>;
}) {
  const columns =
    items.length === 5
      ? "grid-cols-2 gap-y-4 sm:grid-cols-5 sm:gap-y-0 sm:divide-x"
      : items.length === 4
        ? "grid-cols-2 gap-y-4 sm:grid-cols-4 sm:gap-y-0 sm:divide-x"
        : "grid-cols-3 divide-x";

  return (
    <div className={cn("grid divide-border", columns)}>
      {items.map((item) => {
        const content = (
          <>
            <p
              className={cn(
                "text-lg font-bold tabular-nums leading-none tracking-tight md:text-[22px]",
                item.emphasize ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {item.value}
              {item.unit ? (
                <span className="ml-0.5 text-[12px] font-semibold text-muted-foreground">
                  {item.unit}
                </span>
              ) : null}
            </p>
            <p className="mt-1.5 text-[11px] font-medium leading-4 text-muted-foreground sm:mt-2 sm:text-[12px]">
              {item.label}
            </p>
          </>
        );

        const className = "min-w-0 px-1 py-1 text-center sm:first:pl-0 sm:last:pr-0";

        if (item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(className, "transition-opacity hover:opacity-70")}
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={item.key} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function AccountEmptyState({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-1.5 px-2 py-6" : "gap-2 px-4 py-10"
      )}
    >
      <p
        className={cn(
          "tracking-tight text-foreground",
          compact ? "text-[15px] font-semibold" : "text-[16px] font-bold"
        )}
      >
        {title}
      </p>
      {description ? (
        <p className="max-w-md text-[13px] leading-6 text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className={compact ? "mt-2" : "mt-3"}>{action}</div> : null}
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
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
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
        <div key={index} className="h-16 rounded-md bg-foreground/[0.05]" />
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
        "inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        variant === "primary"
          ? "h-11 bg-foreground px-5 text-background hover:bg-foreground/90"
          : "h-auto gap-0.5 px-0 text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
