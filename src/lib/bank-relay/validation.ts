import { computeRelayEventHash } from "@/lib/bank-relay/crypto";
import {
  isValidDepositorName,
  normalizeDepositorName,
} from "@/lib/bank-relay/normalize";
import type {
  RelayDepositPayload,
  RelayHeartbeatPayload,
} from "@/lib/bank-relay/types";

const SEOUL_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/;

function asObject(rawBody: string) {
  const value = JSON.parse(rawBody) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("INVALID_RELAY_PAYLOAD");
  }
  return value as Record<string, unknown>;
}

function isValidSeoulIso(value: string) {
  return SEOUL_ISO_PATTERN.test(value) && Number.isFinite(Date.parse(value));
}

export function parseRelayDepositPayload(rawBody: string): RelayDepositPayload {
  const body = asObject(rawBody);
  const depositorName =
    typeof body.depositorName === "string"
      ? normalizeDepositorName(body.depositorName)
      : "";
  const payload: RelayDepositPayload = {
    eventId: typeof body.eventId === "string" ? body.eventId.trim() : "",
    eventHash:
      typeof body.eventHash === "string" ? body.eventHash.trim().toLowerCase() : "",
    deviceId: typeof body.deviceId === "string" ? body.deviceId.trim() : "",
    bank: body.bank === "KB" ? "KB" : ("" as "KB"),
    accountMask: typeof body.accountMask === "string" ? body.accountMask.trim() : "",
    depositorName,
    amount: Number(body.amount),
    transactionAt:
      typeof body.transactionAt === "string" ? body.transactionAt.trim() : "",
    isTest: body.isTest === true,
  };

  if (
    !/^[A-Za-z0-9-]{8,100}$/.test(payload.eventId) ||
    !/^[a-f0-9]{64}$/.test(payload.eventHash) ||
    payload.bank !== "KB" ||
    !/^[0-9*]{8,30}$/.test(payload.accountMask) ||
    !payload.accountMask.includes("*") ||
    !isValidDepositorName(payload.depositorName) ||
    !Number.isSafeInteger(payload.amount) ||
    payload.amount <= 0 ||
    payload.amount > 1_000_000_000 ||
    !isValidSeoulIso(payload.transactionAt) ||
    payload.eventHash !== computeRelayEventHash(payload)
  ) {
    throw new Error("INVALID_RELAY_PAYLOAD");
  }

  return payload;
}

export function parseRelayHeartbeatPayload(rawBody: string): RelayHeartbeatPayload {
  const body = asObject(rawBody);
  const lastEventAt =
    typeof body.lastEventAt === "string" && body.lastEventAt.trim()
      ? body.lastEventAt.trim()
      : undefined;
  const payload: RelayHeartbeatPayload = {
    deviceId: typeof body.deviceId === "string" ? body.deviceId.trim() : "",
    appVersion: typeof body.appVersion === "string" ? body.appVersion.trim() : "",
    batteryLevel: Number(body.batteryLevel),
    notificationListenerGranted: body.notificationListenerGranted === true,
    pendingQueueCount: Number(body.pendingQueueCount),
    ...(lastEventAt ? { lastEventAt } : {}),
  };

  if (
    !payload.deviceId ||
    !payload.appVersion ||
    payload.appVersion.length > 50 ||
    !Number.isInteger(payload.batteryLevel) ||
    payload.batteryLevel < 0 ||
    payload.batteryLevel > 100 ||
    !Number.isInteger(payload.pendingQueueCount) ||
    payload.pendingQueueCount < 0 ||
    payload.pendingQueueCount > 100_000 ||
    (lastEventAt !== undefined && !isValidSeoulIso(lastEventAt))
  ) {
    throw new Error("INVALID_RELAY_PAYLOAD");
  }

  return payload;
}
