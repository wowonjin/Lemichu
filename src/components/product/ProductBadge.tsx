import {
  BadgeCheck,
  CalendarClock,
  Clock,
  Gem,
  House,
  Plane,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  AuthenticationStatus,
  ConditionGrade,
  DeliveryBadge,
} from "@/types/product";

type BadgeIcon = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

const badgeBase =
  "inline-flex h-[22px] items-center gap-[3px] rounded-[4px] px-1.5 text-[11px] font-semibold leading-none tracking-tight ring-1 ring-inset";

export function ProductBadge({
  children,
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  icon?: BadgeIcon;
  className?: string;
}) {
  return (
    <span className={cn(badgeBase, className)}>
      {Icon ? <Icon className="size-3 shrink-0" strokeWidth={1.8} /> : null}
      {children}
    </span>
  );
}

const authMeta: Record<
  AuthenticationStatus,
  { label: string; icon: BadgeIcon; className: string }
> = {
  VERIFIED: {
    label: "검수완료",
    icon: ShieldCheck,
    className:
      "bg-[#EEFBF4] text-[#0F7A4B] ring-[#B7E4CC] dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  },
  PENDING: {
    label: "검수중",
    icon: Clock,
    className:
      "bg-[#F4F4F5] text-[#5C5C5C] ring-[#E4E4E7] dark:bg-white/8 dark:text-zinc-300 dark:ring-white/15",
  },
  BRAND_OFFICIAL: {
    label: "브랜드공식",
    icon: BadgeCheck,
    className:
      "bg-[#EEF5FF] text-[#1D4F91] ring-[#C5D8F2] dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25",
  },
};

export function AuthenticationBadge({
  status,
  className,
}: {
  status: AuthenticationStatus;
  className?: string;
}) {
  const meta = authMeta[status];
  return (
    <ProductBadge icon={meta.icon} className={cn(meta.className, className)}>
      {meta.label}
    </ProductBadge>
  );
}

const gradeMeta: Record<ConditionGrade, { label: string; className: string }> = {
  NEW: {
    label: "새상품",
    className:
      "bg-[#FFF4E5] text-[#C05621] ring-[#F0C48A] dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/25",
  },
  S: {
    label: "S급",
    className:
      "bg-[#F4F0FF] text-[#5B3A9E] ring-[#D8CCF0] dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-400/25",
  },
  A: {
    label: "A급",
    className:
      "bg-[#EEF5FF] text-[#1D4F91] ring-[#C5D8F2] dark:bg-indigo-400/10 dark:text-indigo-200 dark:ring-indigo-400/25",
  },
  B: {
    label: "B급",
    className:
      "bg-[#F4F4F5] text-[#5C5C5C] ring-[#E4E4E7] dark:bg-white/8 dark:text-zinc-300 dark:ring-white/15",
  },
};

export function ConditionBadge({
  condition,
  className,
}: {
  condition: ConditionGrade;
  className?: string;
}) {
  const meta = gradeMeta[condition];
  return (
    <ProductBadge className={cn(meta.className, className)}>
      {meta.label}
    </ProductBadge>
  );
}

const deliveryMeta: Record<
  DeliveryBadge,
  { icon: BadgeIcon; className: string }
> = {
  오늘출고: {
    icon: Zap,
    className:
      "bg-[#FFF4E5] text-[#C05621] ring-[#F0C48A] dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/25",
  },
  국내배송: {
    icon: House,
    className:
      "bg-[#EEF5FF] text-[#1D4F91] ring-[#C5D8F2] dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25",
  },
  해외배송: {
    icon: Plane,
    className:
      "bg-[#F4F0FF] text-[#6B3FA0] ring-[#D8CCF0] dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-400/25",
  },
  예약배송: {
    icon: CalendarClock,
    className:
      "bg-[#F4F4F5] text-[#5C5C5C] ring-[#E4E4E7] dark:bg-white/8 dark:text-zinc-300 dark:ring-white/15",
  },
};

export function DeliveryBadgeChip({
  delivery,
  className,
}: {
  delivery: DeliveryBadge;
  className?: string;
}) {
  const meta = deliveryMeta[delivery];
  return (
    <ProductBadge icon={meta.icon} className={cn(meta.className, className)}>
      {delivery}
    </ProductBadge>
  );
}

export const OFFER_BADGE_LABELS = ["가격하락", "희소상품", "미사용급"] as const;
export type OfferBadgeLabel = (typeof OFFER_BADGE_LABELS)[number];

const offerMeta: Record<
  OfferBadgeLabel,
  { icon: BadgeIcon; className: string }
> = {
  가격하락: {
    icon: TrendingDown,
    className:
      "bg-[#FFF0F1] text-[#C81E3A] ring-[#F5C2C8] dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/25",
  },
  희소상품: {
    icon: Gem,
    className:
      "bg-[#FBF6EA] text-[#8A6A2A] ring-[#E6D5A6] dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
  },
  미사용급: {
    icon: Sparkles,
    className:
      "bg-[#EEFBF4] text-[#0F7A4B] ring-[#B7E4CC] dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  },
};

export function isOfferBadge(label: string): label is OfferBadgeLabel {
  return OFFER_BADGE_LABELS.includes(label as OfferBadgeLabel);
}

export function OfferBadge({
  label,
  className,
}: {
  label: OfferBadgeLabel;
  className?: string;
}) {
  const meta = offerMeta[label];
  return (
    <ProductBadge icon={meta.icon} className={cn(meta.className, className)}>
      {label}
    </ProductBadge>
  );
}
