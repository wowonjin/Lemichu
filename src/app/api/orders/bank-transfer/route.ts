import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import {
  isValidDepositorName,
  normalizeDepositorName,
} from "@/lib/bank-relay/normalize";
import { BANK_TRANSFER_ACCOUNT } from "@/lib/bank-transfer";
import {
  checkoutOrderErrorMessage,
  checkoutOrderErrorStatus,
  generateBankTransferOrderId,
  getDepositDueAt,
  parseCheckoutDelivery,
  parseCheckoutItems,
} from "@/lib/bank-transfer-order-server";
import { getRegisteredProducts } from "@/lib/catalog";
import {
  calculateCheckoutAmounts,
  resolveCheckoutItems,
  toOrderItemSnapshot,
} from "@/lib/checkout";
import { FirebaseAuthError, getAdminDb, requireFirebaseUser } from "@/lib/firebase-admin";
import {
  BANK_TRANSFER_POINT_RATE,
  calculatePurchasePoints,
  toSafePoints,
} from "@/lib/points";
import { completePayment } from "@/lib/payment-completion";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 32_768) {
      return NextResponse.json(
        { ok: false, message: "주문 요청 데이터가 너무 큽니다." },
        { status: 413 }
      );
    }
    const user = await requireFirebaseUser(req);
    const body = (await req.json().catch(() => null)) as {
      productId?: unknown;
      variantId?: unknown;
      items?: unknown;
      usePoints?: unknown;
      depositorName?: unknown;
      delivery?: unknown;
    } | null;

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
    const checkoutItems = parseCheckoutItems(body?.items, {
      productId: body?.productId,
      variantId: body?.variantId,
    });
    const resolved = resolveCheckoutItems(checkoutItems, await getRegisteredProducts());

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
        includeShipping: true,
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

    return NextResponse.json(
      { ok: false, error: errorCode, message: checkoutOrderErrorMessage(error) },
      { status: checkoutOrderErrorStatus(error) }
    );
  }
}
