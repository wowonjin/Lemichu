import { deleteApp, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  RelayAuthenticationError,
  computeRelayEventHash,
} from "@/lib/bank-relay/crypto";
import { processRelayDeposit } from "@/lib/bank-relay/process-deposit";
import type { RelayDepositPayload } from "@/lib/bank-relay/types";

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const app = hasEmulator
  ? initializeApp({ projectId: "lemichu-bank-relay-test" }, `relay-${Date.now()}`)
  : null;
const db = app ? getFirestore(app) : null;
const transactionAt = "2026-08-24T14:31:00+09:00";

function payload(overrides: Partial<RelayDepositPayload> = {}): RelayDepositPayload {
  const base = {
    eventId: "12345678-1234-1234-1234-123456789012",
    deviceId: "kb-server-phone-01",
    bank: "KB" as const,
    accountMask: "498125****8895",
    depositorName: "홍길동",
    amount: 1_250_000,
    transactionAt,
    isTest: false,
    ...overrides,
  };
  return { ...base, eventHash: computeRelayEventHash(base) };
}

describe.skipIf(!hasEmulator)("bank relay Firestore transaction", () => {
  beforeEach(async () => {
    if (!db) return;
    for (const collection of [
      "bankRelayDevices",
      "bankRelayNonces",
      "bankDepositEvents",
      "bankRelayAuditLogs",
      "orders",
      "products",
      "users",
    ]) {
      await db.recursiveDelete(db.collection(collection));
    }
    await Promise.all([
      db.collection("bankRelayDevices").doc("kb-server-phone-01").set({
        deviceId: "kb-server-phone-01",
        enabled: true,
      }),
      db.collection("users").doc("user-1").set({ points: 0 }),
      db.collection("products").doc("product-1").set({
        stockQuantity: 1,
        variants: [
          {
            id: "variant-1",
            surchargeKrw: 0,
            stockStatus: "quantity_managed",
            quantity: 1,
          },
        ],
      }),
      db.collection("orders").doc("BT-1").set({
        userId: "user-1",
        status: "pending",
        paymentMethod: "BANK_TRANSFER",
        paymentStatus: "WAITING_FOR_DEPOSIT",
        expectedAmount: 1_250_000,
        depositorName: "홍길동",
        depositorNameNormalized: "홍길동",
        createdAt: Timestamp.fromMillis(Date.parse(transactionAt) - 60_000),
        depositDueAt: Timestamp.fromMillis(Date.parse(transactionAt) + 60_000),
        amounts: { finalTotal: 1_250_000 },
        items: [{ productId: "product-1", variantId: "variant-1", quantity: 1 }],
        payment: { provider: "bank-transfer", method: "무통장 입금" },
        reward: { granted: false, reversed: false },
        inventory: { processed: false },
      }),
    ]);
  });

  afterAll(async () => {
    if (app) await deleteApp(app);
  });

  it("atomically matches, pays, prepares, and never decrements twice", async () => {
    if (!db) return;
    const event = payload();
    const first = await processRelayDeposit({
      db,
      headers: {
        deviceId: event.deviceId,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: "12345678-1234-1234-1234-123456789012",
      },
      payload: event,
    });
    const second = await processRelayDeposit({
      db,
      headers: {
        deviceId: event.deviceId,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: "22345678-1234-1234-1234-123456789012",
      },
      payload: event,
    });
    const [order, product] = await Promise.all([
      db.collection("orders").doc("BT-1").get(),
      db.collection("products").doc("product-1").get(),
    ]);

    expect(first).toMatchObject({ eventStatus: "MATCHED", matchedOrderId: "BT-1" });
    expect(second.status).toBe("already_processed");
    expect(order.data()).toMatchObject({
      paymentStatus: "PAID",
      status: "preparing",
      paymentReference: `bank-deposit:${event.eventHash}`,
      inventory: { processed: true },
    });
    expect(product.data()?.stockQuantity).toBe(0);
  });

  it("rejects a reused nonce", async () => {
    if (!db) return;
    const event = payload();
    const headers = {
      deviceId: event.deviceId,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: "32345678-1234-1234-1234-123456789012",
    };
    await processRelayDeposit({ db, headers, payload: event });
    await expect(
      processRelayDeposit({
        db,
        headers,
        payload: payload({
          eventId: "42345678-1234-1234-1234-123456789012",
          amount: 2_000,
        }),
      })
    ).rejects.toBeInstanceOf(RelayAuthenticationError);
  });

  it("matches and completes a guest order without a member document", async () => {
    if (!db) return;
    await db.collection("orders").doc("BT-1").update({
      userId: FieldValue.delete(),
      isGuest: true,
      source: "web-guest-bank-transfer",
      reward: { points: 0, rate: 0, granted: false, reversed: false },
    });

    const event = payload();
    const result = await processRelayDeposit({
      db,
      headers: {
        deviceId: event.deviceId,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: "52345678-1234-1234-1234-123456789012",
      },
      payload: event,
    });
    const order = await db.collection("orders").doc("BT-1").get();

    expect(result).toMatchObject({
      eventStatus: "MATCHED",
      matchedOrderId: "BT-1",
    });
    expect(order.data()).toMatchObject({
      isGuest: true,
      paymentStatus: "PAID",
      status: "preparing",
      reward: { points: 0, rate: 0, granted: false },
      inventory: { processed: true },
    });
  });
});
