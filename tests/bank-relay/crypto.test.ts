import { beforeEach, describe, expect, it } from "vitest";
import {
  computeRelayEventHash,
  computeRelaySignature,
  timingSafeHexEqual,
} from "@/lib/bank-relay/crypto-primitives";
import {
  RelayAuthenticationError,
  verifyRelayRequestSignature,
} from "@/lib/bank-relay/crypto";
import { parseRelayDepositPayload } from "@/lib/bank-relay/validation";

const secret = "test-secret-that-is-longer-than-thirty-two-characters";
const deviceId = "kb-server-phone-01";

function signedRequest(rawBody: string, timestamp: string, nonce: string) {
  return new Request("https://example.com/api/internal/bank-relay/deposits", {
    method: "POST",
    headers: {
      "X-Relay-Device": deviceId,
      "X-Relay-Timestamp": timestamp,
      "X-Relay-Nonce": nonce,
      "X-Relay-Signature": computeRelaySignature(secret, timestamp, nonce, rawBody),
    },
    body: rawBody,
  });
}

beforeEach(() => {
  process.env.KB_RELAY_DEVICE_ID = deviceId;
  process.env.KB_RELAY_DEVICE_SECRET = secret;
});

describe("relay cryptography", () => {
  it("verifies a signature over the exact raw body", () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const rawBody = '{"eventId":"event-123"}';
    const headers = verifyRelayRequestSignature(
      signedRequest(rawBody, timestamp, "12345678-1234-1234-1234-123456789012"),
      rawBody
    );
    expect(headers.deviceId).toBe(deviceId);
  });

  it("rejects a changed body and a stale timestamp", () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const request = signedRequest(
      '{"amount":1000}',
      timestamp,
      "12345678-1234-1234-1234-123456789012"
    );
    expect(() => verifyRelayRequestSignature(request, '{"amount":2000}')).toThrow(
      RelayAuthenticationError
    );

    const stale = String(Math.floor(Date.now() / 1000) - 301);
    expect(() =>
      verifyRelayRequestSignature(
        signedRequest("{}", stale, "22345678-1234-1234-1234-123456789012"),
        "{}"
      )
    ).toThrow("RELAY_TIMESTAMP_OUT_OF_RANGE");
  });

  it("uses timing-safe fixed length comparisons", () => {
    const signature = computeRelaySignature(secret, "1234567890", "nonce-1234567890", "{}");
    expect(timingSafeHexEqual(signature, signature)).toBe(true);
    expect(timingSafeHexEqual(signature, `${signature.slice(0, -1)}0`)).toBe(false);
    expect(timingSafeHexEqual(signature, "not-hex")).toBe(false);
  });
});

describe("relay payload validation", () => {
  it("recomputes the canonical event hash and preserves test mode", () => {
    const event = {
      eventId: "12345678-1234-1234-1234-123456789012",
      deviceId,
      bank: "KB" as const,
      accountMask: "498125****8895",
      depositorName: "  홍길동  ",
      amount: 1_250_000,
      transactionAt: "2026-08-24T14:31:00+09:00",
      isTest: true,
    };
    const rawBody = JSON.stringify({
      ...event,
      eventHash: computeRelayEventHash(event),
    });
    const parsed = parseRelayDepositPayload(rawBody);
    expect(parsed.depositorName).toBe("홍길동");
    expect(parsed.isTest).toBe(true);
  });

  it("accepts the Android parser timestamp format without seconds", () => {
    const event = {
      eventId: "22345678-1234-1234-1234-123456789012",
      deviceId,
      bank: "KB" as const,
      accountMask: "498125****8895",
      depositorName: "홍길동",
      amount: 1_250_000,
      transactionAt: "2026-07-10T16:40+09:00",
      isTest: true,
    };
    const rawBody = JSON.stringify({
      ...event,
      eventHash: computeRelayEventHash(event),
    });

    expect(parseRelayDepositPayload(rawBody).transactionAt).toBe(
      event.transactionAt
    );
  });
});
