import { randomBytes } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import {
  isValidDepositorName,
  normalizeDepositorName,
} from "@/lib/bank-relay/normalize";
import { BANK_TRANSFER_ACCOUNT } from "@/lib/bank-transfer";
import { getRegisteredProducts } from "@/lib/catalog";
import {
  calculateCheckoutAmounts,
  resolveCheckoutItems,
  toOrderItemSnapshot,
} from "@/lib/checkout";
import { FirebaseAuthError, getAdminDb, requireFirebaseUser } from "@/lib/firebase-admin";
import type { CheckoutDeliveryInput } from "@/lib/bank-transfer-order";
import type { OrderDeliveryInfo } from "@/lib/orders";
import {
  BANK_TRANSFER_POINT_RATE,
  calculatePurchasePoints,
  toSafePoints,
} from "@/lib/points";
import { completePayment } from "@/lib/payment-completion";

export const runtime = "nodejs";

function generateBankTransferOrderId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `BT-${year}${month}${day}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function getDepositDueAt() {
  const configured = Number(process.env.BANK_TRANSFER_DEPOSIT_DUE_HOURS ?? 24);
  const hours = Number.isFinite(configured)
    ? Math.min(Math.max(Math.floor(configured), 1), 168)
    : 24;
  return Timestamp.fromMillis(Date.now() + hours * 60 * 60 * 1000);
}

function readString(value: unknown, max = 120) {
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

function parseCheckoutDelivery(value: unknown): OrderDeliveryInfo | { error: string } {
  const input = value && typeof value === "object" ? (value as CheckoutDeliveryInput) : null;
  const recipientName = readString(input?.recipientName, 40);
  const address1 = readString(input?.address1, 120);
  const address2 = readString(input?.address2, 80);
  const postalCode = readString(input?.postalCode, 10);
  const phone = normalizeDeliveryPhone(readString(input?.phone, 20));

  if (!recipientName) return { error: "받는 분 이름을 입력해주세요." };
  if (!phone) return { error: "휴대전화번호를 숫자 10~11자리로 입력해주세요." };
  if (!address1) return { error: "배송 주소를 입력해주세요." };

  return {
    recipientName,
    phone,
    postalCode: postalCode || undefined,
    address1,
    address2: address2 || undefined,
  };
}

function getErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "EMPTY_CHECKOUT_ITEMS") return "구매할 상품을 선택해주세요.";
  if (code === "PRODUCT_NOT_FOUND") return "구매할 상품 정보를 찾을 수 없어요.";
  if (code === "VARIANT_REQUIRED") return "색상과 사이즈 옵션을 선택해주세요.";
  if (code === "VARIANT_NOT_FOUND") return "선택한 상품 옵션을 찾을 수 없어요.";
  if (code === "VARIANT_SOLD_OUT") return "선택한 상품 옵션이 품절되었습니다.";
  if (code === "INSUFFICIENT_VARIANT_STOCK") return "선택한 옵션의 재고가 부족합니다.";
  return "주문을 접수하지 못했어요.";
}

export async function POST(req: Request) {
  try {
    const user = await requireFirebaseUser(req);
    const body = (await req.json().catch(() => null)) as {
      productId?: unknown;
      variantId?: unknown;
      usePoints?: unknown;
      depositorName?: unknown;
      delivery?: unknown;
    } | null;

    const productId = typeof body?.productId === "string" ? body.productId.trim() : "";
    const variantId = typeof body?.variantId === "string" ? body.variantId.trim() : undefined;
    const usePoints = body?.usePoints === true;
    const depositorName =
      typeof body?.depositorName === "string" ? normalizeDepositorName(body.depositorName) : "";
    if (!isValidDepositorName(depositorName)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_DEPOSITOR_NAME", message: "입금자명을 입력해주세요." },
        { status: 400 }
      );
    }
    const delivery = parseCheckoutDelivery(body?.delivery);
    if ("error" in delivery) {
      return NextResponse.json(
        { ok: false, error: "INVALID_DELIVERY", message: delivery.error },
        { status: 400 }
      );
    }
    const resolved = resolveCheckoutItems(
      [{ productId, variantId, quantity: 1 }],
      await getRegisteredProducts()
    );

    const db = getAdminDb();
    const userRef = db.collection("users").doc(user.uid);
    const paymentMethod = BANK_TRANSFER_ACCOUNT.methodLabel;
    const orderId = generateBankTransferOrderId();
    const orderRef = db.collection("orders").doc(orderId);
    const ledgerRef = userRef.collection("pointLedger").doc(`spend_${orderId}`);
    const itemSnapshots = resolved.map(toOrderItemSnapshot);
    const userEmail = user.email || "";
    const userName = user.name || userEmail.split("@")[0] || "LEMICHU 고객";
    const depositDueAt = getDepositDueAt();

    const createdAmounts = await db.runTransaction(async (tx) => {
      const latestUser = await tx.get(userRef);
      const latestPoints = usePoints ? toSafePoints(latestUser.data()?.points) : 0;
      const amounts = calculateCheckoutAmounts(resolved, {
        pointsToUse: latestPoints,
        includeShipping: false,
      });
      const expectedEarn = calculatePurchasePoints(amounts.finalTotal, paymentMethod);
      const fullyPaidWithPoints = amounts.finalTotal === 0;

      tx.create(orderRef, {
        userId: user.uid,
        userEmail,
        userName,
        status: "pending",
        paymentMethod: fullyPaidWithPoints ? "POINTS" : "BANK_TRANSFER",
        paymentStatus: fullyPaidWithPoints ? "PENDING" : "WAITING_FOR_DEPOSIT",
        expectedAmount: amounts.finalTotal,
        depositorName,
        depositorNameNormalized: normalizeDepositorName(depositorName),
        depositDueAt,
        itemCount: itemSnapshots.reduce<number>((sum, item) => sum + item.quantity, 0),
        items: itemSnapshots,
        amounts,
        source: "web-bank-transfer",
        orderNo: orderId,
        delivery,
        payment: {
          provider: fullyPaidWithPoints ? "points" : "bank-transfer",
          method: paymentMethod,
          requestedMethod: "TRANSFER",
          amount: amounts.finalTotal,
          requestedAt: FieldValue.serverTimestamp(),
        },
        points: {
          spent: amounts.pointsUsed > 0,
          restored: false,
        },
        reward: {
          points: expectedEarn,
          rate: amounts.finalTotal > 0 ? BANK_TRANSFER_POINT_RATE : 0,
          granted: false,
          reversed: false,
          method: paymentMethod,
        },
        inventory: {
          processed: false,
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (amounts.pointsUsed > 0) {
        tx.set(
          userRef,
          {
            points: FieldValue.increment(-amounts.pointsUsed),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        tx.set(ledgerRef, {
          type: "spend",
          amount: amounts.pointsUsed,
          reason: "주문 결제 사용",
          orderId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      return amounts;
    });

    if (createdAmounts.finalTotal === 0) {
      await completePayment({
        orderId,
        paymentReference: `points-only:${orderId}`,
        paymentMethod: "POINTS",
      });
    }

    return NextResponse.json({
      ok: true,
      orderId,
      pointsToUse: createdAmounts.pointsUsed,
      payablePrice: createdAmounts.finalTotal,
      depositorName,
      depositDueAt: depositDueAt.toDate().toISOString(),
      expectedEarn: calculatePurchasePoints(createdAmounts.finalTotal, paymentMethod),
    });
  } catch (error) {
    if (error instanceof FirebaseAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, message: "로그인 후 적립금을 사용하고 주문할 수 있어요." },
        { status: error.status }
      );
    }

    const errorCode = error instanceof Error ? error.message : "BANK_TRANSFER_ORDER_FAILED";
    const status = [
      "EMPTY_CHECKOUT_ITEMS",
      "VARIANT_REQUIRED",
      "VARIANT_NOT_FOUND",
    ].includes(errorCode)
      ? 400
      : errorCode === "PRODUCT_NOT_FOUND"
        ? 404
        : ["VARIANT_SOLD_OUT", "INSUFFICIENT_VARIANT_STOCK"].includes(errorCode)
          ? 409
          : 500;

    return NextResponse.json(
      { ok: false, error: errorCode, message: getErrorMessage(error) },
      { status }
    );
  }
}
