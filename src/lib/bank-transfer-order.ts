import { getFirebaseIdToken } from "@/lib/auth";

export type CheckoutDeliveryInput = {
  recipientName: string;
  phone: string;
  postalCode?: string;
  address1: string;
  address2?: string;
};

export async function submitBankTransferOrder({
  productId,
  variantId,
  usePoints,
  depositorName,
  delivery,
}: {
  productId: string;
  variantId?: string;
  usePoints: boolean;
  depositorName: string;
  delivery: CheckoutDeliveryInput;
}) {
  const token = await getFirebaseIdToken();
  if (!token) {
    throw new Error("로그인 후 적립금을 사용하고 주문할 수 있어요.");
  }

  const response = await fetch("/api/orders/bank-transfer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, variantId, usePoints, depositorName, delivery }),
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

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "주문을 접수하지 못했어요.");
  }

  return json;
}
