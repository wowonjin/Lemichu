import "server-only";

import { randomBytes } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import type { CheckoutItemInput } from "@/lib/checkout";
import type { CheckoutDeliveryInput } from "@/lib/bank-transfer-order";
import type { OrderDeliveryInfo } from "@/lib/orders";

export function generateBankTransferOrderId(guest = false) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const prefix = guest ? "GBT" : "BT";
  return `${prefix}-${year}${month}${day}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function getDepositDueAt() {
  const configured = Number(process.env.BANK_TRANSFER_DEPOSIT_DUE_HOURS ?? 24);
  const hours = Number.isFinite(configured)
    ? Math.min(Math.max(Math.floor(configured), 1), 168)
    : 24;
  return Timestamp.fromMillis(Date.now() + hours * 60 * 60 * 1000);
}

export function readOrderString(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeDeliveryPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return "";
}

export function parseCheckoutDelivery(
  value: unknown
): OrderDeliveryInfo | { error: string } {
  const input =
    value && typeof value === "object" ? (value as CheckoutDeliveryInput) : null;
  const recipientName = readOrderString(input?.recipientName, 40);
  const address1 = readOrderString(input?.address1, 120);
  const address2 = readOrderString(input?.address2, 80);
  const postalCode = readOrderString(input?.postalCode, 10);
  const phone = normalizeDeliveryPhone(readOrderString(input?.phone, 20));
  const message = readOrderString(input?.message, 100);

  if (!recipientName) return { error: "받는 분 이름을 입력해주세요." };
  if (!phone) {
    return { error: "휴대전화번호를 숫자 10~11자리로 입력해주세요." };
  }
  if (!postalCode) return { error: "우편번호를 입력해주세요." };
  if (!address1) return { error: "배송 주소를 입력해주세요." };

  // Firestore rejects `undefined` field values — omit optional empties.
  const delivery: OrderDeliveryInfo = {
    recipientName,
    phone,
    postalCode,
    address1,
  };
  if (address2) delivery.address2 = address2;
  if (message) delivery.message = message;
  return delivery;
}

export function parseCheckoutItems(
  value: unknown,
  fallback?: { productId?: unknown; variantId?: unknown }
): CheckoutItemInput[] {
  const rawItems = Array.isArray(value)
    ? value
    : fallback
      ? [
          {
            productId: fallback.productId,
            variantId: fallback.variantId,
            quantity: 1,
          },
        ]
      : [];

  if (rawItems.length === 0) throw new Error("EMPTY_CHECKOUT_ITEMS");
  if (rawItems.length > 20) throw new Error("TOO_MANY_CHECKOUT_ITEMS");

  return rawItems.map((raw) => {
    const item =
      raw && typeof raw === "object"
        ? (raw as {
            productId?: unknown;
            variantId?: unknown;
            quantity?: unknown;
          })
        : {};
    const productId = readOrderString(item.productId, 160);
    const variantId = readOrderString(item.variantId, 160);
    const quantity = Number(item.quantity ?? 1);

    if (!productId) throw new Error("PRODUCT_NOT_FOUND");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error("INVALID_QUANTITY");
    }

    return {
      productId,
      variantId: variantId || undefined,
      quantity,
    };
  });
}

export function checkoutOrderErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "EMPTY_CHECKOUT_ITEMS") return "구매할 상품을 선택해주세요.";
  if (code === "TOO_MANY_CHECKOUT_ITEMS") {
    return "한 번에 최대 20개 상품까지 주문할 수 있어요.";
  }
  if (code === "INVALID_QUANTITY") return "상품 수량이 올바르지 않아요.";
  if (code === "PRODUCT_NOT_FOUND") return "구매할 상품 정보를 찾을 수 없어요.";
  if (code === "VARIANT_REQUIRED") return "색상과 사이즈 옵션을 선택해주세요.";
  if (code === "VARIANT_NOT_FOUND") return "선택한 상품 옵션을 찾을 수 없어요.";
  if (code === "VARIANT_SOLD_OUT") return "선택한 상품 옵션이 품절되었습니다.";
  if (code === "INSUFFICIENT_VARIANT_STOCK") {
    return "선택한 옵션의 재고가 부족합니다.";
  }
  return "주문을 접수하지 못했어요.";
}

export function checkoutOrderErrorStatus(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (
    [
      "EMPTY_CHECKOUT_ITEMS",
      "TOO_MANY_CHECKOUT_ITEMS",
      "INVALID_QUANTITY",
      "VARIANT_REQUIRED",
      "VARIANT_NOT_FOUND",
    ].includes(code)
  ) {
    return 400;
  }
  if (code === "PRODUCT_NOT_FOUND") return 404;
  if (["VARIANT_SOLD_OUT", "INSUFFICIENT_VARIANT_STOCK"].includes(code)) {
    return 409;
  }
  return 500;
}
