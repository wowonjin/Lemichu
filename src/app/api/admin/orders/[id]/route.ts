import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { updateOrderDelivery } from "@/lib/member-account-admin";
import type { OrderStatus } from "@/lib/orders";
import { completePayment } from "@/lib/payment-completion";
import { syncOrderPointsOnStatusChange } from "@/lib/points-admin";

export const runtime = "nodejs";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "failed",
  "preparing",
  "shipping",
  "delivered",
  "cancelled",
];

const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending: ["paid", "cancelled", "failed"],
  paid: ["preparing", "shipping", "delivered", "cancelled"],
  preparing: ["shipping", "delivered", "cancelled"],
  shipping: ["delivered", "cancelled"],
  delivered: ["cancelled"],
  failed: [],
  cancelled: [],
};

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json(
      { ok: false, message: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    status?: unknown;
    delivery?: { courier?: unknown; invoiceNo?: unknown };
  } | null;

  if (body?.delivery && !isOrderStatus(body.status)) {
    try {
      await updateOrderDelivery(id, {
        courier: typeof body.delivery.courier === "string" ? body.delivery.courier : undefined,
        invoiceNo: typeof body.delivery.invoiceNo === "string" ? body.delivery.invoiceNo : undefined,
      });
      return NextResponse.json({ ok: true });
    } catch (error) {
      return NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "배송 정보를 저장하지 못했어요." },
        { status: 400 }
      );
    }
  }

  if (!isOrderStatus(body?.status)) {
    return NextResponse.json(
      { ok: false, message: "주문 상태가 올바르지 않아요." },
      { status: 400 }
    );
  }

  const nextStatus = body.status;
  const db = getAdminDb();
  const orderRef = db.collection("orders").doc(id);
  const snapshot = await orderRef.get();

  if (!snapshot.exists) {
    return NextResponse.json(
      { ok: false, message: "주문 정보를 찾을 수 없어요." },
      { status: 404 }
    );
  }

  const previousStatus = String(snapshot.data()?.status || "pending");
  if (previousStatus === nextStatus) {
    return NextResponse.json({ ok: true, status: nextStatus });
  }

  const allowed = ALLOWED_TRANSITIONS[previousStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    return NextResponse.json(
      { ok: false, message: "이 주문 상태로는 변경할 수 없어요." },
      { status: 409 }
    );
  }

  if (nextStatus === "paid") {
    try {
      await completePayment({
        orderId: id,
        paymentReference: `admin-manual:${id}`,
        paymentMethod: String(
          snapshot.data()?.payment?.method || snapshot.data()?.payment?.requestedMethod || "MANUAL"
        ),
        paymentDetails: {
          confirmedBy: "admin",
        },
      });
      return NextResponse.json({ ok: true, status: "preparing" });
    } catch (error) {
      const code = error instanceof Error ? error.message : "PAYMENT_COMPLETION_FAILED";
      return NextResponse.json(
        {
          ok: false,
          error: code,
          message:
            code === "INSUFFICIENT_INVENTORY"
              ? "재고가 부족하여 결제완료 처리할 수 없습니다."
              : "결제완료 처리 중 문제가 발생했습니다.",
        },
        { status: code === "INSUFFICIENT_INVENTORY" ? 409 : 500 }
      );
    }
  }

  await orderRef.update({
    status: nextStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (body.delivery) {
    await updateOrderDelivery(id, {
      courier: typeof body.delivery.courier === "string" ? body.delivery.courier : undefined,
      invoiceNo: typeof body.delivery.invoiceNo === "string" ? body.delivery.invoiceNo : undefined,
    }).catch((error) => {
      console.error("[admin-orders] delivery update failed", error);
    });
  }

  await syncOrderPointsOnStatusChange({
    orderId: id,
    previousStatus,
    nextStatus,
    paymentMethod: String(
      snapshot.data()?.payment?.method || snapshot.data()?.payment?.requestedMethod || ""
    ),
  }).catch((error) => {
    console.error("[admin-orders] points sync failed", error);
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}
