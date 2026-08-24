import "server-only";

import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import {
  RelayAuthenticationError,
  relayNonceDocumentId,
} from "@/lib/bank-relay/crypto";
import type {
  RelayHeaders,
  RelayHeartbeatPayload,
} from "@/lib/bank-relay/types";

export async function processRelayHeartbeat({
  db,
  headers,
  payload,
}: {
  db: Firestore;
  headers: RelayHeaders;
  payload: RelayHeartbeatPayload;
}) {
  const deviceRef = db.collection("bankRelayDevices").doc(headers.deviceId);
  const nonceRef = db
    .collection("bankRelayNonces")
    .doc(relayNonceDocumentId(headers.deviceId, headers.nonce));

  await db.runTransaction(async (tx) => {
    const [deviceSnapshot, nonceSnapshot] = await Promise.all([
      tx.get(deviceRef),
      tx.get(nonceRef),
    ]);
    if (!deviceSnapshot.exists || deviceSnapshot.data()?.enabled !== true) {
      throw new RelayAuthenticationError("RELAY_DEVICE_DISABLED");
    }
    if (nonceSnapshot.exists) {
      throw new RelayAuthenticationError("RELAY_NONCE_REUSED");
    }

    tx.create(nonceRef, {
      deviceId: headers.deviceId,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
    });
    tx.update(deviceRef, {
      lastSeenAt: FieldValue.serverTimestamp(),
      appVersion: payload.appVersion,
      batteryLevel: payload.batteryLevel,
      notificationListenerGranted: payload.notificationListenerGranted,
      pendingQueueCount: payload.pendingQueueCount,
      ...(payload.lastEventAt
        ? { lastEventAt: Timestamp.fromMillis(Date.parse(payload.lastEventAt)) }
        : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
