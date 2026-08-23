import { FieldValue } from "firebase-admin/firestore";
import {
  assertExpectedProject,
  getFirebaseAdminServices,
} from "./lib/firebase-admin.mjs";

const shouldWrite = process.argv.includes("--write");
const expectedProject =
  process.env.FIREBASE_TARGET_PROJECT_ID || "lemichu-25c26";
const productIdPattern = /^lp-\d{3}$/;
const storagePathPattern = /^products\/seed-lp-\d{3}\//;
const productHrefPattern = /^\/product\/lp-\d{3}$/;

async function listStorageFiles(bucket) {
  try {
    const [files] = await bucket.getFiles({ prefix: "products/seed-lp-" });
    return files;
  } catch (error) {
    if (error?.code === 404) {
      console.log("[mock-cleanup] configured Storage bucket does not exist; skipping objects");
      return [];
    }
    throw error;
  }
}

async function main() {
  const { db, bucket, projectId } = getFirebaseAdminServices();
  assertExpectedProject(projectId, expectedProject);

  const productSnapshot = await db.collection("products").get();
  const mockProductDocs = productSnapshot.docs.filter((doc) =>
    productIdPattern.test(doc.id)
  );
  const storageFiles = await listStorageFiles(bucket);
  const mockStorageFiles = storageFiles.filter((file) =>
    storagePathPattern.test(file.name)
  );
  const rejectedStorageFiles = storageFiles.filter(
    (file) => !storagePathPattern.test(file.name)
  );

  if (rejectedStorageFiles.length > 0) {
    throw new Error(
      `Refusing cleanup: unexpected objects under seed prefix: ${rejectedStorageFiles
        .map((file) => file.name)
        .join(", ")}`
    );
  }

  const categorySnapshot = await db.collection("homeCategories").get();
  const categoryUpdates = categorySnapshot.docs
    .map((doc) => {
      const items = Array.isArray(doc.get("items")) ? doc.get("items") : [];
      const keptItems = items.filter(
        (item) => !productHrefPattern.test(String(item?.href ?? ""))
      );
      return {
        ref: doc.ref,
        id: doc.id,
        removed: items.length - keptItems.length,
        keptItems,
      };
    })
    .filter((update) => update.removed > 0);

  console.log(`[mock-cleanup] project=${projectId}`);
  console.log(
    `[mock-cleanup] Firestore products: ${mockProductDocs.length} (${mockProductDocs
      .map((doc) => doc.id)
      .join(", ") || "none"})`
  );
  console.log(`[mock-cleanup] Storage objects: ${mockStorageFiles.length}`);
  console.log(
    `[mock-cleanup] home category links: ${categoryUpdates.reduce(
      (sum, update) => sum + update.removed,
      0
    )}`
  );

  if (!shouldWrite) {
    console.log("[mock-cleanup] dry run complete; pass --write to delete");
    return;
  }

  const batch = db.batch();
  for (const doc of mockProductDocs) batch.delete(doc.ref);
  for (const update of categoryUpdates) {
    batch.update(update.ref, {
      items: update.keptItems,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  await Promise.all(mockStorageFiles.map((file) => file.delete()));

  console.log(
    `[mock-cleanup] deleted products=${mockProductDocs.length} storage=${mockStorageFiles.length} categoryLinks=${categoryUpdates.reduce(
      (sum, update) => sum + update.removed,
      0
    )}`
  );
}

main().catch((error) => {
  console.error(`[mock-cleanup] failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
