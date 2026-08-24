import {
  assertExpectedProject,
  getFirebaseAdminServices,
} from "./lib/firebase-admin.mjs";

const { db, projectId } = getFirebaseAdminServices();
assertExpectedProject(projectId);

const matched = await db
  .collection("bankDepositEvents")
  .where("status", "==", "MATCHED")
  .limit(500)
  .get();
const failures = [];

for (const eventDocument of matched.docs) {
  const event = eventDocument.data();
  const orderId = String(event.matchedOrderId || "");
  if (!orderId) {
    failures.push(`${eventDocument.id}: missing matchedOrderId`);
    continue;
  }
  const orderSnapshot = await db.collection("orders").doc(orderId).get();
  const order = orderSnapshot.data();
  if (!orderSnapshot.exists) failures.push(`${eventDocument.id}: order missing`);
  if (order?.paymentStatus !== "PAID") failures.push(`${eventDocument.id}: order not PAID`);
  if (!["preparing", "shipping", "delivered"].includes(String(order?.status))) {
    failures.push(`${eventDocument.id}: fulfillment status invalid`);
  }
  if (Number(order?.expectedAmount) !== Number(event.amount)) {
    failures.push(`${eventDocument.id}: amount mismatch`);
  }
  if (order?.paymentReference !== `bank-deposit:${eventDocument.id}`) {
    failures.push(`${eventDocument.id}: payment reference mismatch`);
  }
}

console.log(`Project: ${projectId}`);
console.log(`Matched events checked: ${matched.size}`);
console.log(`Failures: ${failures.length}`);
for (const failure of failures) console.error(failure);
if (failures.length > 0) process.exitCode = 1;
