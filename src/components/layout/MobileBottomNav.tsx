"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { cn } from "@/lib/cn";

const items = [
  { id: "home", label: "홈", href: "/", icon: Home },
  { id: "search", label: "검색", href: "/search", icon: Search },
  { id: "products", label: "상품", href: "/products", icon: ShoppingBag },
  { id: "wishlist", label: "찜", href: "/my/wishlist", icon: Heart },
  { id: "my", label: "마이", href: "/my", icon: User },
] as const;

function matchesHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isNavActive(pathname: string, href: string) {
  if (!matchesHref(pathname, href)) return false;
  return !items.some(
    (item) =>
      item.href !== href &&
      item.href.length > href.length &&
      matchesHref(pathname, item.href)
  );
}

function formatBadge(count: number) {
  if (count > 99) return "99+";
  return String(count);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { count } = useWishlist();

  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-50 bg-background shadow-[0_-1px_0_hsl(var(--border)),0_-10px_28px_rgba(15,23,42,0.06)] md:hidden"
    >
      <ul className="grid h-[var(--mobile-bottom-nav-height)] grid-cols-5 px-1">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          const badge = item.id === "wishlist" ? count : 0;

          return (
            <li key={item.id} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1 text-[10px] tracking-tight transition-colors",
                  active ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-5 top-0 h-[2px] rounded-full bg-gold transition-opacity",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="relative grid size-6 place-items-center">
                  <item.icon
                    className={cn("size-[22px]", active && "fill-gold/20 text-gold")}
                    strokeWidth={active ? 2.2 : 1.7}
                  />
                  {badge > 0 ? (
                    <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-foreground px-1 text-center text-[9px] font-semibold leading-4 text-background">
                      {formatBadge(badge)}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-background" />
    </nav>
  );
}
