import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/base-url";
import { getCatalogProducts } from "@/lib/catalog";
import {
  buildTossOrderName,
  calculateCheckoutAmounts,
  resolveCheckoutItems,
  toOrderItemSnapshot,
  type CheckoutItemInput,
} from "@/lib/checkout";
import { FirebaseAuthError, getAdminDb, requireFirebaseUser } from "@/lib/firebase-admin";
import { generateTossOrderId, getTossPaymentClientKey } from "@/lib/toss";

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
  return "결제 주문을 생성하지 못했어요.";
}

export async function POST(req: Request) {
  try {
    const user = await requireFirebaseUser(req);
    const body = await req.json().catch(() => null);
    const items = resolveCheckoutItems(toCheckoutItems(body), await getCatalogProducts());
    const amounts = calculateCheckoutAmounts(items);

    if (!Number.isFinite(amounts.finalTotal) || amounts.finalTotal <= 0) {
      return NextResponse.json(
        { ok: false, error: "INVALID_AMOUNT", message: "결제 금액을 확인해주세요." },
        { status: 400 }
      );
    }

    const paymentClientKey = getTossPaymentClientKey();
    const orderId = generateTossOrderId();
    const orderName = buildTossOrderName(items);
    const itemSnapshots = items.map(toOrderItemSnapshot);
    const baseUrl = getBaseUrl(req);
    const db = getAdminDb();
    const userEmail = user.email || "";
    const userName = user.name || userEmail.split("@")[0] || "LEMICHU 고객";

    await db.collection("orders").doc(orderId).create({
      userId: user.uid,
      userEmail,
      userName,
      status: "pending",
      itemCount: itemSnapshots.reduce((sum, item) => sum + item.quantity, 0),
      items: itemSnapshots,
      amounts,
      source: "web-toss",
      orderNo: orderId,
      payment: {
        provider: "toss",
        orderId,
        orderName,
        amount: amounts.finalTotal,
        requestedAt: FieldValue.serverTimestamp(),
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      paymentClientKey,
      customerKey: user.uid,
      customerEmail: userEmail || undefined,
      customerName: userName,
      order: {
        orderId,
        orderName,
        amount: amounts.finalTotal,
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
