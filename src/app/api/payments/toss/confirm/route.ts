import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { FirebaseAuthError, getAdminDb, requireFirebaseUser } from "@/lib/firebase-admin";
import { basicAuthHeader, getTossSecretKey } from "@/lib/toss";

export const runtime = "nodejs";

type ConfirmBody = {
  paymentKey: string;
  orderId: string;
  amount: number;
};

function parseConfirmBody(body: unknown): ConfirmBody {
  if (!body || typeof body !== "object") {
    throw new Error("INVALID_REQUEST");
  }

  const current = body as Record<string, unknown>;
  const paymentKey = typeof current.paymentKey === "string" ? current.paymentKey.trim() : "";
  const orderId = typeof current.orderId === "string" ? current.orderId.trim() : "";
  const amount = Number(current.amount);

  if (!paymentKey || !orderId || !Number.isInteger(amount) || amount <= 0) {
    throw new Error("INVALID_REQUEST");
  }

  return { paymentKey, orderId, amount };
}

export async function POST(req: Request) {
  try {
    const user = await requireFirebaseUser(req);
    const { paymentKey, orderId, amount } = parseConfirmBody(
      await req.json().catch(() => null)
    );
    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      return NextResponse.json(
        { ok: false, error: "ORDER_NOT_FOUND", message: "주문 정보를 찾을 수 없어요." },
        { status: 404 }
      );
    }

    const order = orderSnapshot.data() as {
      userId?: string;
      status?: string;
      amounts?: { finalTotal?: number };
      payment?: { paymentKey?: string };
    };

    if (order.userId !== user.uid) {
      return NextResponse.json(
        { ok: false, error: "ORDER_NOT_FOUND", message: "주문 정보를 찾을 수 없어요." },
        { status: 404 }
      );
    }

    if (Number(order.amounts?.finalTotal) !== amount) {
      return NextResponse.json(
        { ok: false, error: "AMOUNT_MISMATCH", message: "결제 금액이 주문 금액과 달라요." },
        { status: 400 }
      );
    }

    if (order.status === "paid") {
      return NextResponse.json({
        ok: true,
        alreadyConfirmed: true,
        redirectTo: "/my/orders",
      });
    }

    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(getTossSecretKey()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const tossJson = await tossResponse.json().catch(() => ({}));

    if (!tossResponse.ok) {
      await orderRef.update({
        status: "failed",
        "payment.paymentKey": paymentKey,
        "payment.failure": tossJson,
        "payment.failedAt": FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json(
        {
          ok: false,
          error: "TOSS_CONFIRM_FAILED",
          message: tossJson?.message || "토스페이먼츠 결제 승인에 실패했어요.",
          details: tossJson,
        },
        { status: 400 }
      );
    }

    await orderRef.update({
      status: "paid",
      "payment.paymentKey": paymentKey,
      "payment.method": tossJson?.method || "toss",
      "payment.toss": tossJson,
      "payment.approvedAt": FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      redirectTo: "/my/orders",
    });
  } catch (error) {
    if (error instanceof FirebaseAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, message: "로그인 후 결제를 승인할 수 있어요." },
        { status: error.status }
      );
    }

    const isInvalidRequest = error instanceof Error && error.message === "INVALID_REQUEST";
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "CONFIRM_PAYMENT_FAILED",
        message: isInvalidRequest
          ? "결제 승인 요청 정보가 올바르지 않아요."
          : "결제 승인 중 문제가 발생했어요.",
      },
      { status: isInvalidRequest ? 400 : 500 }
    );
  }
}
