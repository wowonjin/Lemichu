import "server-only";

import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import { getRelayAccountMask } from "@/lib/bank-relay/config";
import {
  RelayAuthenticationError,
  relayNonceDocumentId,
} from "@/lib/bank-relay/crypto";
import type {
  BankDepositEventStatus,
  RelayDepositPayload,
  RelayHeaders,
} from "@/lib/bank-relay/types";
import { classifyExactCandidates } from "@/lib/bank-relay/matcher";
import { normalizeDepositorName } from "@/lib/bank-relay/normalize";
import { applyPaymentCompletionInTransaction } from "@/lib/payment-completion";

type ProcessResult = {
  status: "processed" | "already_processed";
  eventStatus: BankDepositEventStatus;
  matchedOrderId?: string;
};

function toMillis(value: unknown) {
  if (value instanceof Timestamp) return value.toMillis();
  return 0;
}

function eventDocument(payload: RelayDepositPayload) {
  return {
    eventId: payload.eventId,
    eventHash: payload.eventHash,
    deviceId: payload.deviceId,
    bank: payload.bank,
    accountMask: payload.accountMask,
    depositorName: payload.depositorName,
    depositorNameNormalized: normalizeDepositorName(payload.depositorName),
    amount: payload.amount,
    transactionAt: Timestamp.fromMillis(Date.parse(payload.transactionAt)),
    isTest: payload.isTest,
    createdAt: FieldValue.serverTimestamp(),
  };
}

export async function processRelayDeposit({
  db,
  headers,
  payload,
}: {
  db: Firestore;
  headers: RelayHeaders;
  payload: RelayDepositPayload;
}): Promise<ProcessResult> {
  const deviceRef = db.collection("bankRelayDevices").doc(headers.deviceId);
  const nonceRef = db
    .collection("bankRelayNonces")
    .doc(relayNonceDocumentId(headers.deviceId, headers.nonce));
  const eventRef = db.collection("bankDepositEvents").doc(payload.eventHash);

  return db.runTransaction(async (tx) => {
    const [deviceSnapshot, nonceSnapshot, existingEvent] = await Promise.all([
      tx.get(deviceRef),
      tx.get(nonceRef),
      tx.get(eventRef),
    ]);
    if (!deviceSnapshot.exists || deviceSnapshot.data()?.enabled !== true) {
      throw new RelayAuthenticationError("RELAY_DEVICE_DISABLED");
    }
    if (nonceSnapshot.exists) {
      throw new RelayAuthenticationError("RELAY_NONCE_REUSED");
    }

    const writeNonceAndDevice = () => {
      tx.create(nonceRef, {
        deviceId: headers.deviceId,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
      });
      tx.update(deviceRef, {
        lastSeenAt: FieldValue.serverTimestamp(),
        lastEventAt: Timestamp.fromMillis(Date.parse(payload.transactionAt)),
        updatedAt: FieldValue.serverTimestamp(),
      });
    };

    if (existingEvent.exists) {
      writeNonceAndDevice();
      return {
        status: "already_processed",
        eventStatus: String(existingEvent.data()?.status || "RECEIVED") as BankDepositEventStatus,
        ...(existingEvent.data()?.matchedOrderId
          ? { matchedOrderId: String(existingEvent.data()?.matchedOrderId) }
          : {}),
      };
    }

    const configuredMask = getRelayAccountMask();
    if (!payload.isTest && !configuredMask) {
      throw new Error("KB_RELAY_ACCOUNT_MASK_NOT_CONFIGURED");
    }
    if (payload.isTest || payload.accountMask !== configuredMask) {
      const reason = payload.isTest ? "TEST_EVENT" : "ACCOUNT_MASK_MISMATCH";
      tx.create(eventRef, {
        ...eventDocument(payload),
        status: "IGNORED",
        matchReason: reason,
      });
      writeNonceAndDevice();
      return { status: "processed", eventStatus: "IGNORED" };
    }

    const candidateQuery = db
      .collection("orders")
      .where("paymentMethod", "==", "BANK_TRANSFER")
      .where("paymentStatus", "==", "WAITING_FOR_DEPOSIT")
      .where("expectedAmount", "==", payload.amount)
      .where(
        "depositorNameNormalized",
        "==",
        normalizeDepositorName(payload.depositorName)
      );
    const candidateSnapshot = await tx.get(candidateQuery);
    const transactionAt = Date.parse(payload.transactionAt);
    const candidates = candidateSnapshot.docs.filter((candidate) => {
      const data = candidate.data();
      const createdAt = toMillis(data.createdAt);
      const dueAt = toMillis(data.depositDueAt);
      return (
        createdAt > 0 &&
        dueAt > 0 &&
        transactionAt >= createdAt - 2 * 60 * 1000 &&
        transactionAt <= dueAt
      );
    });

    if (candidates.length !== 1) {
      const status: BankDepositEventStatus = classifyExactCandidates(candidates.length);
      tx.create(eventRef, {
        ...eventDocument(payload),
        status,
        matchReason: candidates.length === 0 ? "NO_EXACT_ORDER" : "MULTIPLE_EXACT_ORDERS",
        candidateOrderIds: candidates.map((candidate) => candidate.id),
      });
      writeNonceAndDevice();
      return { status: "processed", eventStatus: status };
    }

    const candidate = candidates[0]!;
    try {
      await applyPaymentCompletionInTransaction({
        db,
        tx,
        orderRef: candidate.ref,
        orderSnapshot: candidate,
        input: {
          orderId: candidate.id,
          paymentReference: `bank-deposit:${payload.eventHash}`,
          paymentMethod: "무통장 입금",
          paidAt: Timestamp.fromMillis(transactionAt),
          paymentDetails: {
            bank: "KB",
            accountMask: payload.accountMask,
            depositorName: payload.depositorName,
            relayEventHash: payload.eventHash,
          },
        },
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "PAYMENT_COMPLETION_FAILED";
      if (
        ![
          "INSUFFICIENT_INVENTORY",
          "INVENTORY_VARIANT_NOT_FOUND",
          "INVENTORY_PRODUCT_NOT_FOUND",
        ].includes(code)
      ) {
        throw error;
      }
      tx.create(eventRef, {
        ...eventDocument(payload),
        status: "UNMATCHED",
        matchReason: code,
        candidateOrderIds: [candidate.id],
      });
      writeNonceAndDevice();
      return { status: "processed", eventStatus: "UNMATCHED" };
    }

    tx.create(eventRef, {
      ...eventDocument(payload),
      status: "MATCHED",
      matchedOrderId: candidate.id,
      matchedAt: FieldValue.serverTimestamp(),
      matchReason: "EXACT_NAME_AND_AMOUNT",
    });
    writeNonceAndDevice();
    return {
      status: "processed",
      eventStatus: "MATCHED",
      matchedOrderId: candidate.id,
    };
  });
}
