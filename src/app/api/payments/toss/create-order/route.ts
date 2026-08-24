import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/base-url";
import { getRegisteredProducts } from "@/lib/catalog";
import {
  buildTossOrderName,
  calculateCheckoutAmounts,
  resolveCheckoutItems,
  toOrderItemSnapshot,
  type CheckoutItemInput,
} from "@/lib/checkout";
import { FirebaseAuthError, getAdminDb, requireFirebaseUser } from "@/lib/firebase-admin";
import { calculatePurchasePoints, toSafePoints, type TossCheckoutMethod } from "@/lib/points";
import { completePayment } from "@/lib/payment-completion";
import { generateTossOrderId, getTossPaymentClientKey } from "@/lib/toss";

function toCheckoutMethod(value: unknown): TossCheckoutMethod {
  return value === "TRANSFER" ? "TRANSFER" : "CARD";
}

export const runtime = "nodejs";

function toCheckoutItems(body: unknown): CheckoutItemInput[] {
  if (!body || typeof body !== "object") {
    throw new Error("INVALID_REQUEST");
  }

  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) {
    throw new Error("INVALID_REQUEST");
  }

  return items.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("INVALID_REQUEST");
    }

    const current = item as Record<string, unknown>;
    return {
      productId: typeof current.productId === "string" ? current.productId : "",
      variantId: typeof current.variantId === "string" ? current.variantId : undefined,
      quantity: typeof current.quantity === "number" ? current.quantity : Number(current.quantity ?? 1),
      option: typeof current.option === "string" ? current.option : undefined,
      expectedArrival:
        typeof current.expectedArrival === "string" ? current.expectedArrival : undefined,
      store: typeof current.store === "string" ? current.store : undefined,
    };
  });
}

function getErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "EMPTY_CHECKOUT_ITEMS") return "구매할 상품을 선택해주세요.";
  if (code === "PRODUCT_NOT_FOUND") return "구매할 상품 정보를 찾을 수 없어요.";
  if (code === "VARIANT_REQUIRED") return "색상과 사이즈 옵션을 선택해주세요.";
  if (code === "VARIANT_NOT_FOUND") return "선택한 상품 옵션을 찾을 수 없어요.";
  if (code === "VARIANT_SOLD_OUT") return "선택한 상품 옵션이 품절되었습니다.";
  if (code === "INSUFFICIENT_VARIANT_STOCK") return "선택한 옵션의 재고가 부족합니다.";
  if (code === "TOSS_PAYMENT_CLIENT_KEY_NOT_SET") return "토스페이먼츠 클라이언트 키 설정이 필요합니다.";
  if (code === "TOSS_PAYMENT_CLIENT_KEY_IS_SECRET_KEY") return "토스페이먼츠 클라이언트 키에 시크릿 키가 입력되어 있어요.";
  if (code === "TOSS_PAYMENT_CLIENT_KEY_IS_WIDGET_KEY") return "토스 단건 결제에는 API 개별 연동 클라이언트 키가 필요합니다.";
  if (code === "INVALID_AMOUNT") return "결제 금액을 확인해주세요.";
  return "결제 주문을 생성하지 못했어요.";
}

export async function POST(req: Request) {
  try {
    const user = await requireFirebaseUser(req);
    const body = await req.json().catch(() => null);
    const items = resolveCheckoutItems(toCheckoutItems(body), await getRegisteredProducts());
    const requestedMethod = toCheckoutMethod(
      body && typeof body === "object" ? (body as { method?: unknown }).method : undefined
    );
    const usePoints =
      Boolean(body && typeof body === "object" && (body as { usePoints?: unknown }).usePoints);

    const db = getAdminDb();
    const userRef = db.collection("users").doc(user.uid);
    const userSnap = await userRef.get();
    const availablePoints = usePoints ? toSafePoints(userSnap.data()?.points) : 0;
    const amounts = calculateCheckoutAmounts(items, { pointsToUse: availablePoints });

    if (!Number.isFinite(amounts.finalTotal) || amounts.finalTotal < 0) {
      return NextResponse.json(
        { ok: false, error: "INVALID_AMOUNT", message: "결제 금액을 확인해주세요." },
        { status: 400 }
      );
    }

    if (amounts.finalTotal > 0 && amounts.finalTotal < 100) {
      return NextResponse.json(
        { ok: false, error: "INVALID_AMOUNT", message: "결제 금액이 너무 작아요. 적립금 사용 금액을 조정해 주세요." },
        { status: 400 }
      );
    }

    const orderId = generateTossOrderId();
    const orderName = buildTossOrderName(items);
    const itemSnapshots = items.map(toOrderItemSnapshot);
    const baseUrl = getBaseUrl(req);
    const userEmail = user.email || "";
    const userName = user.name || userEmail.split("@")[0] || "LEMICHU 고객";
    const createdAmounts = await db.runTransaction(async (tx) => {
      const latestUser = await tx.get(userRef);
      const latestPoints = usePoints ? toSafePoints(latestUser.data()?.points) : 0;
      const latestAmounts = calculateCheckoutAmounts(items, { pointsToUse: latestPoints });
      const latestPaidInFull = latestAmounts.finalTotal === 0;

      if (latestAmounts.finalTotal > 0 && latestAmounts.finalTotal < 100) {
        throw new Error("INVALID_AMOUNT");
      }

      tx.create(db.collection("orders").doc(orderId), {
        userId: user.uid,
        userEmail,
        userName,
        status: "pending",
        paymentMethod: latestPaidInFull
          ? "POINTS"
          : requestedMethod === "TRANSFER"
            ? "TOSS_TRANSFER"
            : "TOSS_CARD",
        paymentStatus: "PENDING",
        expectedAmount: latestAmounts.finalTotal,
        itemCount: itemSnapshots.reduce<number>((sum, item) => sum + item.quantity, 0),
        items: itemSnapshots,
        amounts: latestAmounts,
        source: "web-toss",
        orderNo: orderId,
        payment: {
          provider: latestPaidInFull ? "points" : "toss",
          orderId,
          orderName,
          amount: latestAmounts.finalTotal,
          requestedMethod,
          requestedAt: FieldValue.serverTimestamp(),
        },
        points: {
          spent: latestAmounts.pointsUsed > 0,
          restored: false,
        },
        reward: {
          points: calculatePurchasePoints(
            latestAmounts.finalTotal,
            requestedMethod === "TRANSFER" ? "TRANSFER" : requestedMethod
          ),
          rate: requestedMethod === "TRANSFER" ? 0.01 : 0,
          granted: false,
          reversed: false,
          method: requestedMethod,
        },
        inventory: {
          processed: false,
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (latestAmounts.pointsUsed > 0) {
        tx.set(
          userRef,
          {
            points: FieldValue.increment(-latestAmounts.pointsUsed),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        tx.set(userRef.collection("pointLedger").doc(`spend_${orderId}`), {
          type: "spend",
          amount: latestAmounts.pointsUsed,
          reason: "주문 결제 사용",
          orderId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      return latestAmounts;
    });

    if (createdAmounts.finalTotal === 0) {
      await completePayment({
        orderId,
        paymentReference: `points-only:${orderId}`,
        paymentMethod: "POINTS",
      });
      return NextResponse.json({
        ok: true,
        alreadyPaid: true,
        customerKey: user.uid,
        customerEmail: userEmail || undefined,
        customerName: userName,
        order: {
          orderId,
          orderName,
          amount: 0,
          successUrl: `${baseUrl}/payments/toss/success`,
          failUrl: `${baseUrl}/payments/toss/fail`,
        },
      });
    }

    const paymentClientKey = getTossPaymentClientKey();

    return NextResponse.json({
      ok: true,
      paymentClientKey,
      customerKey: user.uid,
      customerEmail: userEmail || undefined,
      customerName: userName,
      order: {
        orderId,
        orderName,
        amount: createdAmounts.finalTotal,
        successUrl: `${baseUrl}/payments/toss/success`,
        failUrl: `${baseUrl}/payments/toss/fail`,
      },
    });
  } catch (error) {
    if (error instanceof FirebaseAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, message: "로그인 후 결제할 수 있어요." },
        { status: error.status }
      );
    }

    const errorCode = error instanceof Error ? error.message : "CREATE_ORDER_FAILED";
    const status =
      [
        "INVALID_REQUEST",
        "INVALID_AMOUNT",
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
      {
        ok: false,
        error: errorCode,
        message: getErrorMessage(error),
      },
      { status }
    );
  }
}
