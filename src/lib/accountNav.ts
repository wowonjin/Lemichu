import type { LucideIcon } from "lucide-react";
import {
  Heart,
  Home,
  MessageCircle,
  Package,
  Settings,
  Store,
  Ticket,
} from "lucide-react";

export type AccountNavKey =
  | "home"
  | "orders"
  | "interest"
  | "sell"
  | "benefits"
  | "account"
  | "support";

export type AccountNavItem = {
  key: AccountNavKey;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type AccountSubNavItem = {
  href: string;
  label: string;
};

export const ACCOUNT_NAV: AccountNavItem[] = [
  { key: "home", label: "마이페이지", href: "/my", icon: Home },
  { key: "orders", label: "주문", href: "/my/orders", icon: Package },
  { key: "interest", label: "관심", href: "/my/wishlist", icon: Heart },
  { key: "sell", label: "판매", href: "/my/sell", icon: Store },
  { key: "benefits", label: "혜택", href: "/my/coupons", icon: Ticket },
  { key: "account", label: "내 정보", href: "/my/settings", icon: Settings },
  { key: "support", label: "고객지원", href: "/my/faq", icon: MessageCircle },
];

export const ACCOUNT_SUBNAV: Partial<Record<AccountNavKey, AccountSubNavItem[]>> = {
  orders: [
    { href: "/my/orders", label: "주문 내역" },
    { href: "/my/delivery", label: "배송 조회" },
    { href: "/my/returns", label: "취소·교환·반품" },
  ],
  interest: [
    { href: "/my/wishlist", label: "찜한 상품" },
    { href: "/my/recent", label: "최근 본 상품" },
    { href: "/my/brands", label: "관심 브랜드" },
  ],
  sell: [
    { href: "/my/sell", label: "판매 신청" },
    { href: "/my/consignment", label: "위탁 판매" },
    { href: "/my/inspection", label: "검수 현황" },
    { href: "/my/settlement", label: "정산 내역" },
    { href: "/my/estimate", label: "시세 확인" },
  ],
  benefits: [
    { href: "/my/coupons", label: "쿠폰" },
    { href: "/my/points", label: "적립금" },
  ],
  account: [
    { href: "/my/settings", label: "계정 설정" },
    { href: "/my/addresses", label: "배송지" },
    { href: "/my/payments", label: "결제수단" },
    { href: "/my/notifications", label: "알림" },
  ],
  support: [
    { href: "/my/faq", label: "자주 묻는 질문" },
  ],
};

const NAV_ALIASES: Array<[string, AccountNavKey]> = [
  ["/my/orders", "orders"],
  ["/my/returns", "orders"],
  ["/my/delivery", "orders"],
  ["/my/wishlist", "interest"],
  ["/my/recent", "interest"],
  ["/my/brands", "interest"],
  ["/my/sell", "sell"],
  ["/my/consignment", "sell"],
  ["/my/inspection", "sell"],
  ["/my/settlement", "sell"],
  ["/my/estimate", "sell"],
  ["/my/coupons", "benefits"],
  ["/my/points", "benefits"],
  ["/my/settings", "account"],
  ["/my/addresses", "account"],
  ["/my/payments", "account"],
  ["/my/notifications", "account"],
  ["/my/grade", "account"],
  ["/my/faq", "support"],
  ["/my/authentication", "support"],
];

function pathMatches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getAccountNavKey(pathname: string): AccountNavKey | null {
  if (pathname === "/my" || pathname === "/my/") return "home";
  if (pathname === "/faq" || pathname.startsWith("/faq/")) return "support";
  if (pathname.startsWith("/sell/estimate")) return "sell";

  const match = NAV_ALIASES.find(([href]) => pathMatches(pathname, href));
  return match?.[1] ?? null;
}

export function isAccountSubNavActive(pathname: string, href: string) {
  if (href === "/my/faq" && (pathname === "/faq" || pathname.startsWith("/faq/"))) return true;
  if (href === "/my/estimate" && pathname.startsWith("/sell/estimate")) return true;
  return pathMatches(pathname, href);
}

export function getAccountPageTitle(pathname: string) {
  if (pathname === "/my" || pathname === "/my/") return "마이페이지";

  const subItems = Object.values(ACCOUNT_SUBNAV).flat();
  const subMatch = subItems.find((item) => isAccountSubNavActive(pathname, item.href));
  if (subMatch) return subMatch.label;

  const key = getAccountNavKey(pathname);
  return ACCOUNT_NAV.find((item) => item.key === key)?.label;
}
