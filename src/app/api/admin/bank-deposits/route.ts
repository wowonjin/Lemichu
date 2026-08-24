import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getRelayDeviceId } from "@/lib/bank-relay/config";
import { getAdminDb } from "@/lib/firebase-admin";

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

function seoulDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export async function GET(request: Request) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json(
      { ok: false, message: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  try {
    const db = getAdminDb();
    const [deviceSnapshot, eventSnapshot] = await Promise.all([
      db.collection("bankRelayDevices").doc(getRelayDeviceId()).get(),
      db.collection("bankDepositEvents").orderBy("createdAt", "desc").limit(100).get(),
    ]);
    const events = eventSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        eventId: String(data.eventId || ""),
        bank: String(data.bank || ""),
        accountMask: String(data.accountMask || ""),
        depositorName: String(data.depositorName || ""),
        amount: Number(data.amount || 0),
        transactionAt: toIso(data.transactionAt),
        status: String(data.status || "RECEIVED"),
        matchedOrderId: data.matchedOrderId ? String(data.matchedOrderId) : null,
        matchReason: data.matchReason ? String(data.matchReason) : null,
        isTest: data.isTest === true,
        createdAt: toIso(data.createdAt),
      };
    });
    const today = seoulDate(new Date().toISOString());
    const todayEvents = events.filter(
      (event) => !event.isTest && seoulDate(event.transactionAt) === today
    );
    const device = deviceSnapshot.data();
    const lastSeenAt = toIso(device?.lastSeenAt);
    const ageMinutes = lastSeenAt
      ? Math.max(0, Math.floor((Date.now() - Date.parse(lastSeenAt)) / 60_000))
      : null;
    const health =
      ageMinutes === null
        ? "OFFLINE"
        : ageMinutes <= 30
          ? "HEALTHY"
          : ageMinutes <= 60
            ? "WARNING"
            : "OFFLINE";

    return NextResponse.json({
      ok: true,
      device: deviceSnapshot.exists
        ? {
            deviceId: String(device?.deviceId || deviceSnapshot.id),
            deviceName: String(device?.deviceName || ""),
            phoneNumber: String(device?.phoneNumber || ""),
            enabled: device?.enabled === true,
            lastSeenAt,
            lastEventAt: toIso(device?.lastEventAt),
            appVersion: String(device?.appVersion || ""),
            batteryLevel:
              typeof device?.batteryLevel === "number" ? device.batteryLevel : null,
            notificationListenerGranted:
              device?.notificationListenerGranted === true,
            pendingQueueCount: Number(device?.pendingQueueCount || 0),
            health,
          }
        : null,
      stats: {
        todayDetected: todayEvents.length,
        autoMatched: todayEvents.filter(
          (event) =>
            event.status === "MATCHED" &&
            event.matchReason === "EXACT_NAME_AND_AMOUNT"
        ).length,
        needsReview: todayEvents.filter((event) =>
          ["UNMATCHED", "AMBIGUOUS"].includes(event.status)
        ).length,
      },
      events,
    });
  } catch (error) {
    console.error(
      "[admin-bank-deposits] list failed",
      error instanceof Error ? error.message : "UNKNOWN"
    );
    return NextResponse.json(
      { ok: false, message: "입금 내역을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
