import { createHash, createHmac, timingSafeEqual } from "crypto";
import { normalizeDepositorName } from "@/lib/bank-relay/normalize";
import type { RelayDepositPayload } from "@/lib/bank-relay/types";

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function computeRelayEventHash(
  event: Pick<
    RelayDepositPayload,
    "bank" | "accountMask" | "depositorName" | "amount" | "transactionAt"
  >
) {
  return sha256(
    `${event.bank}${event.accountMask}${normalizeDepositorName(event.depositorName)}${event.amount}${event.transactionAt}`
  );
}

export function relayNonceDocumentId(deviceId: string, nonce: string) {
  return sha256(`${deviceId}:${nonce}`);
}

export function computeRelaySignature(
  secret: string,
  timestamp: string,
  nonce: string,
  rawBody: string
) {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${nonce}.${rawBody}`, "utf8")
    .digest("hex");
}

export function timingSafeHexEqual(expectedHex: string, suppliedHex: string) {
  if (!/^[a-f0-9]+$/i.test(expectedHex) || !/^[a-f0-9]+$/i.test(suppliedHex)) {
    return false;
  }
  const expected = Buffer.from(expectedHex, "hex");
  const supplied = Buffer.from(suppliedHex, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
