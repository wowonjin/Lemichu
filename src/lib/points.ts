/**
 * 적립금 규칙
 * - 지급: 계좌이체/무통장 입금의 실제 결제액(적립금 사용 후) 1%
 * - 카드 등 그 외 결제수단: 0원
 * - 리뷰: 텍스트 100원, 사진 포함 500원 (reviews.ts)
 * - 사용: 보유액과 상품 금액 중 작은 값만큼 차감
 */
export const BANK_TRANSFER_POINT_RATE = 0.01;
export const POINTS_CHANGED_EVENT = "lemichu-points-changed";

export type TossCheckoutMethod = "CARD" | "TRANSFER";

export type PointLedgerType = "earn" | "spend";

export type PointLedgerEntry = {
  id: string;
  type: PointLedgerType;
  amount: number;
  reason: string;
  orderId?: string;
  reviewId?: string;
  productId?: string;
  purchaseAmount?: number;
  rate?: number;
  createdAt?: { toDate: () => Date; toMillis: () => number };
};

export function isBankTransferMethod(method?: string | null): boolean {
  const value = (method ?? "").trim().toLowerCase().replace(/\s+/g, "");
  return value === "계좌이체" || value === "transfer" || value === "무통장입금";
}

export function toSafePoints(value: unknown) {
  const points = Number(value ?? 0);
  return Number.isFinite(points) && points > 0 ? Math.floor(points) : 0;
}

export function calculatePurchasePoints(
  purchaseAmount: number,
  method?: string | null
): number {
  if (!isBankTransferMethod(method)) return 0;
  if (!Number.isFinite(purchaseAmount) || purchaseAmount <= 0) return 0;
  return Math.floor(purchaseAmount * BANK_TRANSFER_POINT_RATE);
}

export function getUsablePoints(price: number, availablePoints: number) {
  if (!Number.isFinite(price) || !Number.isFinite(availablePoints)) return 0;
  return Math.max(0, Math.min(Math.floor(availablePoints), Math.floor(price)));
}

export function getPayablePrice(price: number, pointsToUse: number) {
  return Math.max(0, Math.round(price) - Math.max(0, Math.floor(pointsToUse)));
}

export function resolvePurchasePoints({
  productTotal,
  availablePoints,
  usePoints,
  method = "TRANSFER",
}: {
  productTotal: number;
  availablePoints: number;
  usePoints: boolean;
  method?: string | null;
}) {
  const pointsToUse = usePoints ? getUsablePoints(productTotal, availablePoints) : 0;
  const payablePrice = getPayablePrice(productTotal, pointsToUse);
  const expectedEarn = calculatePurchasePoints(payablePrice, method);

  return { pointsToUse, payablePrice, expectedEarn };
}

/** 실제 낼 금액 기준 예상 적립. 배송비를 더하지 않습니다. */
export function estimateCheckoutPoints(
  paidAmount: number,
  method?: string | null
): number {
  return calculatePurchasePoints(paidAmount, method);
}

export function publishPointsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(POINTS_CHANGED_EVENT));
}

export function formatPointLedgerDate(entry: Pick<PointLedgerEntry, "createdAt">) {
  const date = entry.createdAt?.toDate();
  if (!date) return "방금 전";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
