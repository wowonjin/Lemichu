"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Trophy, Heart, User } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { label: "홈", href: "/", icon: Home },
  { label: "검색", href: "/search", icon: Search },
  { label: "랭킹", href: "/ranking", icon: Trophy },
  { label: "찜", href: "/wishlist", icon: Heart },
  { label: "마이", href: "/my", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
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
