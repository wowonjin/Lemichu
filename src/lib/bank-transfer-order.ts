import { getFirebaseIdToken } from "@/lib/auth";

export async function submitBankTransferOrder({
  productId,
  variantId,
  usePoints,
  depositorName,
}: {
  productId: string;
  variantId?: string;
  usePoints: boolean;
  depositorName: string;
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
    body: JSON.stringify({ productId, variantId, usePoints, depositorName }),
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
