import type { SavedAddress, NotificationSettings } from "@/lib/accountStorage";

export const MEMBER_GRADES = ["family", "silver", "gold", "vip"] as const;
export type MemberGrade = (typeof MEMBER_GRADES)[number];

export const GRADE_LABELS: Record<MemberGrade, string> = {
  family: "FAMILY",
  silver: "SILVER",
  gold: "GOLD",
  vip: "VIP",
};

export const GRADE_BENEFITS: Record<MemberGrade, string[]> = {
  family: ["기본 회원 혜택", "주문·배송 알림", "카카오톡 고객센터"],
  silver: ["전용 쿠폰 발급 대상", "우선 고객지원"],
  gold: ["추가 쿠폰", "판매 검수 우선 처리"],
  vip: ["전담 상담", "정산 우선 처리"],
};

export const SELL_KINDS = ["sell", "consignment", "estimate"] as const;
export type SellKind = (typeof SELL_KINDS)[number];

export const SELL_KIND_LABELS: Record<SellKind, string> = {
  sell: "판매 신청",
  consignment: "위탁 판매",
  estimate: "시세 확인",
};

export const SELL_STATUSES = [
  "received",
  "pickup",
  "inspecting",
  "selling",
  "settled",
  "rejected",
] as const;
export type SellStatus = (typeof SELL_STATUSES)[number];

export const SELL_STATUS_LABELS: Record<SellStatus, string> = {
  received: "접수",
  pickup: "수거 중",
  inspecting: "검수 중",
  selling: "판매 중",
  settled: "정산 완료",
  rejected: "반려",
};

export const SELL_DASHBOARD_STEPS: Array<{ key: SellStatus; label: string }> = [
  { key: "received", label: "접수" },
  { key: "pickup", label: "수거 중" },
  { key: "inspecting", label: "검수 중" },
  { key: "selling", label: "판매 중" },
  { key: "settled", label: "정산 완료" },
];

export const RETURN_TYPES = ["cancel", "exchange", "return"] as const;
export type ReturnType = (typeof RETURN_TYPES)[number];

export const RETURN_TYPE_LABELS: Record<ReturnType, string> = {
  cancel: "취소",
  exchange: "교환",
  return: "반품",
};

export const RETURN_STATUSES = ["requested", "approved", "rejected", "completed"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  requested: "접수",
  approved: "승인",
  rejected: "거절",
  completed: "완료",
};

export const COUPON_DISCOUNT_TYPES = ["amount", "percent"] as const;
export type CouponDiscountType = (typeof COUPON_DISCOUNT_TYPES)[number];

export const USER_COUPON_STATUSES = ["available", "used", "expired"] as const;
export type UserCouponStatus = (typeof USER_COUPON_STATUSES)[number];

export const NOTIFICATION_KINDS = ["order", "event", "price", "magazine", "admin"] as const;
export type MemberNotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const NOTIFICATION_KIND_LABELS: Record<MemberNotificationKind, string> = {
  order: "주문/배송",
  event: "할인/이벤트",
  price: "가격 변동",
  magazine: "매거진",
  admin: "관리자 알림",
};

export const FAQ_CATEGORIES = ["배송", "정품/검수", "결제/관부가세", "교환/반품", "회원/혜택"] as const;

export type CouponTemplate = {
  id: string;
  name: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrder: number;
  expiresAt: string | null;
  active: boolean;
  createdAt?: string | null;
};

export type UserCoupon = {
  id: string;
  userId: string;
  couponId: string;
  name: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrder: number;
  expiresAt: string | null;
  status: UserCouponStatus;
  usedOrderId?: string;
  issuedAt?: string | null;
};

export type MemberFaq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
  published: boolean;
};

export type SellRequest = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  kind: SellKind;
  brand: string;
  itemName: string;
  condition: string;
  note: string;
  status: SellStatus;
  estimatePrice?: number;
  settlementAmount?: number;
  adminNote?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ReturnRequest = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  orderId: string;
  type: ReturnType;
  reason: string;
  status: ReturnStatus;
  adminNote?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MemberNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href?: string;
  kind: MemberNotificationKind;
  read: boolean;
  createdAt?: string | null;
};

export type MemberProfileExtras = {
  grade?: MemberGrade;
  points?: number;
  addresses?: SavedAddress[];
  notificationSettings?: NotificationSettings;
  followedBrandIds?: string[];
};

export function isMemberGrade(value: unknown): value is MemberGrade {
  return typeof value === "string" && MEMBER_GRADES.includes(value as MemberGrade);
}

export function resolveMemberGrade(value: unknown): MemberGrade {
  return isMemberGrade(value) ? value : "family";
}

export function toIsoDate(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? value : new Date(parsed).toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const record = value as {
      toDate?: () => Date;
      toMillis?: () => number;
      _seconds?: number;
      seconds?: number;
    };
    if (typeof record.toDate === "function") return record.toDate().toISOString();
    if (typeof record.toMillis === "function") return new Date(record.toMillis()).toISOString();
    if (typeof record._seconds === "number") return new Date(record._seconds * 1000).toISOString();
    if (typeof record.seconds === "number") return new Date(record.seconds * 1000).toISOString();
  }
  return null;
}

export function formatMemberDate(value: unknown) {
  const iso = toIsoDate(value);
  if (!iso) return "방금 전";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function isCouponUsable(coupon: Pick<UserCoupon, "status" | "expiresAt">) {
  if (coupon.status !== "available") return false;
  if (!coupon.expiresAt) return true;
  return Date.parse(coupon.expiresAt) >= Date.now();
}

export function formatCouponValue(coupon: Pick<UserCoupon | CouponTemplate, "discountType" | "discountValue">) {
  if (coupon.discountType === "percent") return `${coupon.discountValue}% 할인`;
  return `${new Intl.NumberFormat("ko-KR").format(coupon.discountValue)}원 할인`;
}

export function countSellByStatus(requests: SellRequest[]) {
  return SELL_STATUSES.reduce(
    (counts, status) => {
      counts[status] = requests.filter((item) => item.status === status).length;
      return counts;
    },
    {} as Record<SellStatus, number>
  );
}

export function groupFaqs(items: MemberFaq[]) {
  const groups = new Map<string, MemberFaq[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  return [...groups.entries()].map(([category, faqs]) => ({
    category,
    items: faqs.sort((a, b) => a.order - b.order || a.question.localeCompare(b.question, "ko")),
  }));
}
