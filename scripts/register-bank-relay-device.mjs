import { FieldValue } from "firebase-admin/firestore";
import {
  assertExpectedProject,
  getFirebaseAdminServices,
} from "./lib/firebase-admin.mjs";

const write = process.argv.includes("--write");
const deviceId = process.env.KB_RELAY_DEVICE_ID?.trim() || "kb-server-phone-01";
const deviceName = process.env.KB_RELAY_DEVICE_NAME?.trim() || "KB 입금 서버폰";
const phoneNumber = process.env.KB_RELAY_DEVICE_PHONE?.trim() || "";
const secret = process.env.KB_RELAY_DEVICE_SECRET?.trim() || "";

if (!/^[A-Za-z0-9-]{3,80}$/.test(deviceId)) {
  throw new Error("KB_RELAY_DEVICE_ID is invalid.");
}
if (!phoneNumber) {
  throw new Error("KB_RELAY_DEVICE_PHONE is required.");
}
if (secret.length < 32) {
  throw new Error("KB_RELAY_DEVICE_SECRET must contain at least 32 characters.");
}

const { db, projectId } = getFirebaseAdminServices();
assertExpectedProject(projectId);

console.log(`Project: ${projectId}`);
console.log(`Device: ${deviceId}`);
console.log("Phone configured: yes");
console.log("Secret configured: yes (not stored in Firestore)");

if (!write) {
  console.log("Dry run only. Re-run with --write to register the device.");
  process.exit(0);
}

const deviceRef = db.collection("bankRelayDevices").doc(deviceId);
const existing = await deviceRef.get();
await deviceRef.set(
  {
    deviceId,
    deviceName,
    phoneNumber,
    enabled: true,
    updatedAt: FieldValue.serverTimestamp(),
    ...(!existing.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
  },
  { merge: true }
);

console.log("Relay device registered.");
