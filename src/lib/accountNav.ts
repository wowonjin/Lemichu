import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CircleDollarSign,
  CircleHelp,
  Clock,
  Coins,
  CreditCard,
  Handshake,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Package,
  RotateCcw,
  ScanSearch,
  Settings,
  Store,
  Tag,
  Ticket,
  TrendingUp,
} from "lucide-react";

export type AccountNavKey =
  | "home"
  | "orders"
  | "returns"
  | "wishlist"
  | "recent"
  | "brands"
  | "sell"
  | "consignment"
  | "inspection"
  | "settlement"
  | "estimate"
  | "coupons"
  | "points"
  | "addresses"
  | "payments"
  | "notifications"
  | "settings"
  | "inquiries"
  | "faq";

export type AccountNavItem = {
  key: AccountNavKey;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type AccountNavGroup = {
  title: string;
  items: AccountNavItem[];
};

export const ACCOUNT_NAV: AccountNavGroup[] = [
  {
    title: "마이페이지",
    items: [{ key: "home", label: "홈", href: "/my", icon: Home }],
  },
  {
    title: "쇼핑",
    items: [
      { key: "orders", label: "주문 내역", href: "/my/orders", icon: Package },
      { key: "returns", label: "취소·교환·반품", href: "/my/returns", icon: RotateCcw },
      { key: "wishlist", label: "찜한 상품", href: "/my/wishlist", icon: Heart },
      { key: "recent", label: "최근 본 상품", href: "/my/recent", icon: Clock },
      { key: "brands", label: "관심 브랜드", href: "/my/brands", icon: Tag },
    ],
  },
  {
    title: "판매",
    items: [
      { key: "sell", label: "판매 신청 내역", href: "/my/sell", icon: Store },
      { key: "consignment", label: "위탁 판매 관리", href: "/my/consignment", icon: Handshake },
      { key: "inspection", label: "검수 진행 현황", href: "/my/inspection", icon: ScanSearch },
      { key: "settlement", label: "정산 내역", href: "/my/settlement", icon: CircleDollarSign },
      { key: "estimate", label: "내 명품 시세 확인", href: "/my/estimate", icon: TrendingUp },
    ],
  },
  {
    title: "혜택",
    items: [
      { key: "coupons", label: "쿠폰", href: "/my/coupons", icon: Ticket },
      { key: "points", label: "적립금", href: "/my/points", icon: Coins },
    ],
  },
  {
    title: "내 정보",
    items: [
      { key: "addresses", label: "배송지 관리", href: "/my/addresses", icon: MapPin },
      { key: "payments", label: "결제수단 관리", href: "/my/payments", icon: CreditCard },
      { key: "notifications", label: "알림 설정", href: "/my/notifications", icon: Bell },
      { key: "settings", label: "계정 설정", href: "/my/settings", icon: Settings },
    ],
  },
  {
    title: "고객지원",
    items: [
      { key: "inquiries", label: "1:1 문의", href: "/my/inquiries", icon: MessageCircle },
      { key: "faq", label: "자주 묻는 질문", href: "/my/faq", icon: CircleHelp },
    ],
  },
];

export function getAccountNavKey(pathname: string): AccountNavKey | null {
  if (pathname === "/my") return "home";
  if (pathname.startsWith("/wishlist")) return "wishlist";
  if (pathname === "/faq" || pathname.startsWith("/faq/")) return "faq";
  if (pathname.startsWith("/sell/estimate")) return "estimate";

  const match = ACCOUNT_NAV.flatMap((group) => group.items).find((item) => {
    if (item.href === "/my") return false;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });

  return match?.key ?? null;
}

export function getAccountPageTitle(pathname: string) {
  if (pathname === "/my") return "마이페이지";
  if (pathname.startsWith("/wishlist")) return "찜한 상품";
  const key = getAccountNavKey(pathname);
  return ACCOUNT_NAV.flatMap((group) => group.items).find((item) => item.key === key)?.label;
}
