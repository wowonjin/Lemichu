"use client";

import type { RefObject } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ExternalLink,
  Heart,
  LogOut,
  Receipt,
  Shield,
  Ticket,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { AuthUser } from "@/lib/auth";
import { getAccountBenefits } from "@/lib/accountBenefits";

const menuItems = [
  { href: "/my", label: "마이페이지", icon: User },
  { href: "/my/orders", label: "주문 내역", icon: Receipt },
  { href: "/my/coupons", label: "쿠폰", icon: Ticket },
  { href: "/wishlist", label: "찜", icon: Heart },
] as const;

export function AccountMenu({
  user,
  canAccessAdmin,
  isOpen,
  menuRef,
  onToggle,
  onClose,
  onLogout,
}: {
  user: AuthUser;
  canAccessAdmin: boolean;
  isOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
}) {
  const benefits = getAccountBenefits();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="회원 메뉴"
        aria-expanded={isOpen}
        aria-controls="account-menu"
        onClick={onToggle}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full px-2.5 text-sm font-semibold transition-colors md:px-3",
          isOpen
            ? "bg-secondary text-foreground"
            : "bg-background text-foreground hover:bg-secondary"
        )}
      >
        <span>{user.name}님</span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          strokeWidth={1.8}
        />
      </button>

      <div
        id="account-menu"
        role="menu"
        aria-label="회원 메뉴"
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
        className={cn(
          "absolute right-0 top-full z-30 mt-2 w-[min(calc(100vw-2rem),18.5rem)] origin-top-right overflow-hidden rounded-lg border border-black/[0.05] bg-background shadow-[0_8px_28px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.04)] transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/[0.08] dark:shadow-[0_12px_36px_rgba(0,0,0,0.45)]",
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1.5 scale-[0.98] opacity-0"
        )}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <Link
            href="/my"
            role="menuitem"
            onClick={onClose}
            className="min-w-0 rounded-md py-0.5 transition-colors hover:opacity-70"
          >
            <p className="truncate text-[15px] font-bold leading-tight tracking-tight text-foreground">
              {user.name}님
            </p>
            <p className="mt-1.5 truncate text-[13px] leading-none text-muted-foreground">
              {user.email}
            </p>
          </Link>
          <Link
            href="/my/coupons"
            role="menuitem"
            aria-label={`쿠폰 ${benefits.couponCount}장`}
            onClick={onClose}
            className="shrink-0 transition-transform hover:-translate-y-px"
          >
            <CouponTicket count={benefits.couponCount} />
          </Link>
        </div>

        <div className="py-1.5">
          {menuItems.map((item) => (
            <MenuRow
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              onClose={onClose}
            />
          ))}
          {canAccessAdmin ? (
            <MenuRow
              href="/admin"
              icon={Shield}
              label="관리자"
              onClose={onClose}
              external
            />
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 px-5 py-2.5 text-left text-[14px] font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <LogOut className="size-4 shrink-0" strokeWidth={1.8} />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

function CouponTicket({ count }: { count: number }) {
  return (
    <span className="relative inline-flex h-8 items-stretch overflow-hidden rounded-[5px] bg-[linear-gradient(180deg,#f6e4b0_0%,#e0bc62_42%,#c9a227_58%,#e8d089_100%)] text-[#5c4310] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(120,80,10,0.28),0_1px_2px_rgba(140,100,20,0.18)]">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.38)_48%,transparent_62%)]"
      />
      <span className="relative flex items-center px-2 text-[10px] font-bold tracking-wide">
        쿠폰
      </span>
      <span className="relative w-2.5 shrink-0 self-stretch">
        <span className="absolute inset-y-1 left-1/2 border-l border-dashed border-[#5c4310]/35" />
        <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
        <span className="absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-background" />
      </span>
      <span className="relative flex min-w-[1.75rem] items-center justify-center pr-2 text-[12px] font-bold tabular-nums">
        {count}
      </span>
    </span>
  );
}

function MenuRow({
  href,
  icon: Icon,
  label,
  onClose,
  external,
}: {
  href: string;
  icon: typeof User;
  label: string;
  onClose: () => void;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      role="menuitem"
      onClick={onClose}
      className="flex items-center gap-2.5 px-5 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:bg-secondary"
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.8} />
      <span className="flex-1">{label}</span>
      {external ? <ExternalLink className="size-3.5 text-muted-foreground" strokeWidth={1.8} /> : null}
    </Link>
  );
}
