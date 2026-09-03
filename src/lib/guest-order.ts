import type {
  BankTransferOrderResult,
  CheckoutDeliveryInput,
} from "@/lib/bank-transfer-order";

export type GuestBankTransferOrderInput = {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  email: string;
  guestPassword: string;
  depositorName: string;
  delivery: CheckoutDeliveryInput;
  agreements: {
    terms: true;
    privacy: true;
    purchase: true;
  };
};

export async function submitGuestBankTransferOrder(
  input: GuestBankTransferOrderInput
): Promise<BankTransferOrderResult> {
  const response = await fetch("/api/orders/guest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const json = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    message?: string;
    orderId?: string;
    payablePrice?: number;
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
    throw new Error(json.message || "비회원 주문을 접수하지 못했어요.");
  }

  return {
    orderId: json.orderId,
    payablePrice: json.payablePrice,
    depositorName: json.depositorName || input.depositorName,
    depositDueAt: json.depositDueAt,
  };
}
