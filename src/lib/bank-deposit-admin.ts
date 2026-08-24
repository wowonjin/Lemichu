"use client";

import {
  adminRequestHeaders,
  assertApiOk,
  parseApiJson,
} from "@/lib/admin-client";

export type AdminBankDepositEvent = {
  id: string;
  eventId: string;
  bank: string;
  accountMask: string;
  depositorName: string;
  amount: number;
  transactionAt: string | null;
  status: "RECEIVED" | "MATCHED" | "UNMATCHED" | "AMBIGUOUS" | "IGNORED";
  matchedOrderId: string | null;
  matchReason: string | null;
  isTest: boolean;
  createdAt: string | null;
};

export type AdminBankRelayOverview = {
  device: {
    deviceId: string;
    deviceName: string;
    phoneNumber: string;
    enabled: boolean;
    lastSeenAt: string | null;
    lastEventAt: string | null;
    appVersion: string;
    batteryLevel: number | null;
    notificationListenerGranted: boolean;
    pendingQueueCount: number;
    health: "HEALTHY" | "WARNING" | "OFFLINE";
  } | null;
  stats: {
    todayDetected: number;
    autoMatched: number;
    needsReview: number;
  };
  events: AdminBankDepositEvent[];
};

export type AdminBankDepositCandidate = {
  orderId: string;
  orderNo: string;
  depositorName: string;
  expectedAmount: number;
  createdAt: string | null;
  depositDueAt: string | null;
  exactName: boolean;
};

export async function fetchAdminBankDeposits(): Promise<AdminBankRelayOverview> {
  const response = await fetch("/api/admin/bank-deposits", {
    headers: await adminRequestHeaders(null),
    cache: "no-store",
  });
  const json = await parseApiJson<
    { ok?: boolean; message?: string } & Partial<AdminBankRelayOverview>
  >(response);
  if (!response.ok || !json.ok || !json.stats || !json.events) {
    throw new Error(json.message || "입금 내역을 불러오지 못했습니다.");
  }
  return {
    device: json.device ?? null,
    stats: json.stats,
    events: json.events,
  };
}

export async function fetchBankDepositCandidates(eventHash: string) {
  const response = await fetch(`/api/admin/bank-deposits/${eventHash}`, {
    headers: await adminRequestHeaders(null),
    cache: "no-store",
  });
  const json = await parseApiJson<{
    ok?: boolean;
    message?: string;
    candidates?: AdminBankDepositCandidate[];
  }>(response);
  if (!response.ok || !json.ok) {
    throw new Error(json.message || "후보 주문을 불러오지 못했습니다.");
  }
  return json.candidates ?? [];
}

export async function manuallyMatchBankDeposit(
  eventHash: string,
  orderId: string,
  reason: string
) {
  await assertApiOk(
    await fetch(`/api/admin/bank-deposits/${eventHash}`, {
      method: "POST",
      headers: await adminRequestHeaders(),
      body: JSON.stringify({ orderId, reason }),
    }),
    "수동 입금 처리를 완료하지 못했습니다."
  );
}
