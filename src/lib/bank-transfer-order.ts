import { getFirebaseIdToken } from "@/lib/auth";

export type CheckoutDeliveryInput = {
  recipientName: string;
  phone: string;
  postalCode?: string;
  address1: string;
  address2?: string;
  message?: string;
};

export type BankTransferOrderResult = {
  orderId: string;
  payablePrice: number;
  depositorName: string;
  depositDueAt: string;
  pointsToUse?: number;
  expectedEarn?: number;
};

export async function submitBankTransferOrder({
  productId,
  variantId,
  items,
  usePoints,
  depositorName,
  delivery,
}: {
  productId?: string;
  variantId?: string;
  items?: Array<{ productId: string; variantId?: string; quantity: number }>;
  usePoints: boolean;
  depositorName: string;
  delivery: CheckoutDeliveryInput;
}) {
  const token = await getFirebaseIdToken();
  if (!token) {
    throw new Error("회원 주문을 위해 로그인이 필요해요. 비회원으로 주문해 주세요.");
  }

  const response = await fetch("/api/orders/bank-transfer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      productId,
      variantId,
      items,
      usePoints,
      depositorName,
      delivery,
    }),
  });
  const json = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    message?: string;
    orderId?: string;
    pointsToUse?: number;
    payablePrice?: number;
    expectedEarn?: number;
    depositorName?: string;
    depositDueAt?: string;
  };

  if (
    !response.ok ||
    !json.ok ||
    !json.orderId ||
    typeof json.payablePrice !== "number" ||
    !json.depositDueAt
  ) {
    throw new Error(json.message || "주문을 접수하지 못했어요.");
  }

  return {
    orderId: json.orderId,
    payablePrice: json.payablePrice,
    depositorName: json.depositorName || depositorName,
    depositDueAt: json.depositDueAt,
    pointsToUse: json.pointsToUse,
    expectedEarn: json.expectedEarn,
  } satisfies BankTransferOrderResult;
}
