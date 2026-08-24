import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getVerifiedAdmin } from "@/lib/admin-auth";
import { normalizeDepositorName } from "@/lib/bank-relay/normalize";
import { getAdminDb } from "@/lib/firebase-admin";
import { applyPaymentCompletionInTransaction } from "@/lib/payment-completion";

export const runtime = "nodejs";

function toIso(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventHash: string }> }
) {
  if (!(await getVerifiedAdmin(request))) {
    return NextResponse.json(
      { ok: false, message: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }
  const { eventHash } = await params;
  if (!/^[a-f0-9]{64}$/.test(eventHash)) {
    return NextResponse.json({ ok: false, message: "이벤트 ID가 올바르지 않습니다." }, { status: 400 });
  }

  const db = getAdminDb();
  const eventSnapshot = await db.collection("bankDepositEvents").doc(eventHash).get();
  if (!eventSnapshot.exists) {
    return NextResponse.json({ ok: false, message: "입금 이벤트를 찾을 수 없습니다." }, { status: 404 });
  }
  const event = eventSnapshot.data()!;
  const orders = await db
    .collection("orders")
    .where("paymentMethod", "==", "BANK_TRANSFER")
    .where("paymentStatus", "==", "WAITING_FOR_DEPOSIT")
    .where("expectedAmount", "==", Number(event.amount || 0))
    .limit(20)
    .get();
  const normalizedName = normalizeDepositorName(String(event.depositorName || ""));
  const candidates = orders.docs
    .map((document) => {
      const order = document.data();
      return {
        orderId: document.id,
        orderNo: String(order.orderNo || document.id),
        depositorName: String(order.depositorName || ""),
        expectedAmount: Number(order.expectedAmount || order.amounts?.finalTotal || 0),
        createdAt: toIso(order.createdAt),
        depositDueAt: toIso(order.depositDueAt),
        exactName:
          normalizeDepositorName(String(order.depositorName || "")) === normalizedName,
      };
    })
    .sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));

  return NextResponse.json({ ok: true, candidates });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventHash: string }> }
) {
  const admin = await getVerifiedAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }
  const { eventHash } = await params;
  const body = (await request.json().catch(() => null)) as {
    orderId?: unknown;
    reason?: unknown;
  } | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (!/^[a-f0-9]{64}$/.test(eventHash) || !orderId) {
    return NextResponse.json({ ok: false, message: "수동 매칭 요청이 올바르지 않습니다." }, { status: 400 });
  }

  const db = getAdminDb();
  const eventRef = db.collection("bankDepositEvents").doc(eventHash);
  const orderRef = db.collection("orders").doc(orderId);
  const auditRef = db.collection("bankRelayAuditLogs").doc();

  try {
    await db.runTransaction(async (tx) => {
      const [eventSnapshot, orderSnapshot] = await Promise.all([
        tx.get(eventRef),
        tx.get(orderRef),
      ]);
      if (!eventSnapshot.exists) throw new Error("EVENT_NOT_FOUND");
      if (!orderSnapshot.exists) throw new Error("ORDER_NOT_FOUND");
      const event = eventSnapshot.data()!;
      const order = orderSnapshot.data()!;
      if (!["UNMATCHED", "AMBIGUOUS"].includes(String(event.status))) {
        throw new Error("EVENT_ALREADY_PROCESSED");
      }
      if (
        order.paymentMethod !== "BANK_TRANSFER" ||
        order.paymentStatus !== "WAITING_FOR_DEPOSIT" ||
        order.status !== "pending"
      ) {
        throw new Error("ORDER_NOT_PAYABLE");
      }
      if (Number(order.expectedAmount) !== Number(event.amount)) {
        throw new Error("AMOUNT_MISMATCH");
      }
      const exactName =
        normalizeDepositorName(String(order.depositorName || "")) ===
        normalizeDepositorName(String(event.depositorName || ""));
      if (!exactName && reason.length < 5) {
        throw new Error("MANUAL_REASON_REQUIRED");
      }

      await applyPaymentCompletionInTransaction({
        db,
        tx,
        orderRef,
        orderSnapshot,
        input: {
          orderId,
          paymentReference: `bank-deposit:${eventHash}`,
          paymentMethod: "무통장 입금",
          paidAt:
            event.transactionAt instanceof Timestamp
              ? event.transactionAt
              : Timestamp.now(),
          paymentDetails: {
            bank: "KB",
            accountMask: String(event.accountMask || ""),
            depositorName: String(event.depositorName || ""),
            relayEventHash: eventHash,
            manuallyMatched: true,
          },
        },
      });
      tx.update(eventRef, {
        status: "MATCHED",
        matchedOrderId: orderId,
        matchedAt: FieldValue.serverTimestamp(),
        matchReason: exactName ? "MANUAL_EXACT_MATCH" : "MANUAL_NAME_OVERRIDE",
        processedBy: admin.email,
      });
      tx.create(auditRef, {
        action: "MANUAL_DEPOSIT_MATCH",
        eventHash,
        orderId,
        adminUid: admin.uid,
        adminEmail: admin.email,
        exactName,
        reason: reason || "정확 일치 수동 확인",
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    return NextResponse.json({ ok: true, status: "MATCHED", orderId });
  } catch (error) {
    const code = error instanceof Error ? error.message : "MANUAL_MATCH_FAILED";
    const knownConflict = [
      "EVENT_ALREADY_PROCESSED",
      "ORDER_NOT_PAYABLE",
      "AMOUNT_MISMATCH",
      "MANUAL_REASON_REQUIRED",
      "INSUFFICIENT_INVENTORY",
    ].includes(code);
    return NextResponse.json(
      {
        ok: false,
        error: code,
        message:
          code === "MANUAL_REASON_REQUIRED"
            ? "입금자명이 다르면 5자 이상의 확인 사유가 필요합니다."
            : code === "AMOUNT_MISMATCH"
              ? "입금액과 주문 금액이 달라 처리할 수 없습니다."
              : knownConflict
                ? "현재 상태에서는 이 주문으로 처리할 수 없습니다."
                : "수동 입금 처리 중 문제가 발생했습니다.",
      },
      { status: knownConflict ? 409 : code.endsWith("NOT_FOUND") ? 404 : 500 }
    );
  }
}
