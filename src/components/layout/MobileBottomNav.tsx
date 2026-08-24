"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { id: "home", label: "홈", href: "/", icon: Home },
  { id: "search", label: "검색", href: "/search", icon: Search },
  { id: "products", label: "상품", href: "/products", icon: ShoppingBag },
  { id: "wishlist", label: "찜", href: "/my/wishlist", icon: Heart },
  { id: "my", label: "마이", href: "/my", icon: User },
];

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

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon
                  className={cn("size-5", active && "text-gold")}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
