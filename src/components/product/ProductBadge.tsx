import { ShieldCheck, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  AuthenticationStatus,
  ConditionGrade,
  DeliveryBadge,
} from "@/types/product";

type BadgeTone = "trust" | "delivery" | "grade" | "neutral" | "accent";

const toneStyles: Record<BadgeTone, string> = {
  trust: "bg-emerald-50 text-emerald-700",
  delivery: "bg-sky-50 text-sky-700",
  grade: "bg-violet-50 text-violet-700",
  accent: "bg-gold-soft text-foreground",
  neutral: "border border-border bg-secondary text-muted-foreground",
};

export function ProductBadge({
  children,
  tone = "neutral",
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium leading-none",
        toneStyles[tone],
        className
      )}
    >
      {Icon ? <Icon className="size-3" /> : null}
      {children}
    </span>
  );
}

const authLabel: Record<AuthenticationStatus, string> = {
  VERIFIED: "검수완료",
  PENDING: "검수중",
  BRAND_OFFICIAL: "브랜드공식",
};

const authStyles: Record<AuthenticationStatus, string> = {
  VERIFIED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-slate-100 text-slate-600",
  BRAND_OFFICIAL: "bg-blue-50 text-blue-700",
};

export function AuthenticationBadge({
  status,
  className,
}: {
  status: AuthenticationStatus;
  className?: string;
}) {
  return (
    <ProductBadge
      tone="trust"
      icon={ShieldCheck}
      className={cn(authStyles[status], className)}
    >
      {authLabel[status]}
    </ProductBadge>
  );
}

const gradeLabel: Record<ConditionGrade, string> = {
  NEW: "새상품",
  S: "S급",
  A: "A급",
  B: "B급",
};

const gradeStyles: Record<ConditionGrade, string> = {
  NEW: "bg-amber-50 text-amber-700",
  S: "bg-violet-50 text-violet-700",
  A: "bg-indigo-50 text-indigo-700",
  B: "bg-slate-100 text-slate-600",
};

export function ConditionBadge({
  condition,
  className,
}: {
  condition: ConditionGrade;
  className?: string;
}) {
  return (
    <ProductBadge tone="grade" className={cn(gradeStyles[condition], className)}>
      {gradeLabel[condition]}
    </ProductBadge>
  );
}

const deliveryStyles: Record<DeliveryBadge, string> = {
  오늘출고: "bg-sky-50 text-sky-700",
  국내배송: "bg-blue-50 text-blue-700",
  해외배송: "bg-purple-50 text-purple-700",
  예약배송: "bg-slate-100 text-slate-600",
};

export function DeliveryBadgeChip({
  delivery,
  className,
}: {
  delivery: DeliveryBadge;
  className?: string;
}) {
  return (
    <ProductBadge tone="delivery" icon={Clock} className={cn(deliveryStyles[delivery], className)}>
      {delivery}
    </ProductBadge>
  );
}
