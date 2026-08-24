import "server-only";

import { getRelayDeviceId, getRelayDeviceSecret } from "@/lib/bank-relay/config";
import {
  computeRelayEventHash,
  computeRelaySignature,
  relayNonceDocumentId,
  timingSafeHexEqual,
} from "@/lib/bank-relay/crypto-primitives";
import type { RelayHeaders } from "@/lib/bank-relay/types";

export { computeRelayEventHash, relayNonceDocumentId };

export class RelayAuthenticationError extends Error {
  constructor(message = "UNAUTHORIZED_RELAY_REQUEST") {
    super(message);
    this.name = "RelayAuthenticationError";
  }
}

export function verifyRelayRequestSignature(request: Request, rawBody: string): RelayHeaders {
  const deviceId = request.headers.get("x-relay-device")?.trim() || "";
  const timestampValue = request.headers.get("x-relay-timestamp")?.trim() || "";
  const nonce = request.headers.get("x-relay-nonce")?.trim() || "";
  const signature = request.headers.get("x-relay-signature")?.trim().toLowerCase() || "";
  const timestamp = Number(timestampValue);

  if (
    deviceId !== getRelayDeviceId() ||
    !/^\d{10}$/.test(timestampValue) ||
    !Number.isSafeInteger(timestamp) ||
    !/^[A-Za-z0-9-]{16,100}$/.test(nonce) ||
    !/^[a-f0-9]{64}$/.test(signature)
  ) {
    throw new RelayAuthenticationError();
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestamp) > 5 * 60) {
    throw new RelayAuthenticationError("RELAY_TIMESTAMP_OUT_OF_RANGE");
  }

  const expected = computeRelaySignature(
    getRelayDeviceSecret(),
    timestampValue,
    nonce,
    rawBody
  );
  if (!timingSafeHexEqual(expected, signature)) {
    throw new RelayAuthenticationError();
  }

  return { deviceId, timestamp, nonce };
}
