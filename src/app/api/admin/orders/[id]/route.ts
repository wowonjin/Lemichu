import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { updateOrderDelivery } from "@/lib/member-account-admin";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/orders";
import {
  completePayment,
  reserveOrderInventory,
  restoreOrderInventory,
} from "@/lib/payment-completion";
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

function paymentStatusFromOrderStatus(
  status: OrderStatus,
  paymentMethod?: string
): PaymentStatus {
  if (status === "pending") {
    return paymentMethod === "POINTS" ? "PENDING" : "WAITING_FOR_DEPOSIT";
  }
  if (status === "failed") return "FAILED";
  if (status === "cancelled") return "CANCELLED";
  return "PAID";
}

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
      await reserveOrderInventory(id).catch((error) => {
        console.error("[admin-orders] inventory reserve failed", error);
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

  const orderData = snapshot.data() as {
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    payment?: { method?: string; requestedMethod?: string };
  };
  const previousStatus = String(orderData.status || "pending");
  const paymentMethod = String(
    orderData.paymentMethod || orderData.payment?.method || orderData.payment?.requestedMethod || ""
  );
  const nextPaymentStatus = paymentStatusFromOrderStatus(
    nextStatus,
    paymentMethod as PaymentMethod
  );

  if (previousStatus === nextStatus) {
    if (nextStatus !== "cancelled" && nextStatus !== "failed") {
      await reserveOrderInventory(id).catch((error) => {
        console.error("[admin-orders] inventory reserve failed", error);
      });
    }
    return NextResponse.json({
      ok: true,
      status: nextStatus,
      paymentStatus: nextPaymentStatus,
    });
  }

  const shouldCompletePayment =
    nextStatus === "paid" &&
    previousStatus === "pending" &&
    orderData.paymentStatus !== "PAID";

  if (shouldCompletePayment) {
    try {
      await completePayment({
        orderId: id,
        paymentReference: `admin-manual:${id}`,
        paymentMethod: paymentMethod || "MANUAL",
        paymentDetails: {
          confirmedBy: "admin",
        },
        nextStatus: "paid",
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "PAYMENT_COMPLETION_FAILED";
      if (code !== "ORDER_ALREADY_PAID" && code !== "ORDER_NOT_PAYABLE") {
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
  }

  await orderRef.update({
    status: nextStatus,
    paymentStatus: nextPaymentStatus,
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
    paymentMethod,
  }).catch((error) => {
    console.error("[admin-orders] points sync failed", error);
  });

  if (nextStatus === "cancelled" || nextStatus === "failed") {
    await restoreOrderInventory(id).catch((error) => {
      console.error("[admin-orders] inventory restore failed", error);
    });
  } else if (!shouldCompletePayment) {
    await reserveOrderInventory(id).catch((error) => {
      console.error("[admin-orders] inventory reserve failed", error);
    });
  }

  return NextResponse.json({
    ok: true,
    status: nextStatus,
    paymentStatus: nextPaymentStatus,
  });
}
