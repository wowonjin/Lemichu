import { createReadStream } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { FieldValue } from "firebase-admin/firestore";
import {
  assertExpectedProject,
  getFirebaseAdminServices,
} from "./lib/firebase-admin.mjs";

const COLLECTION = "buyma_translated_source";
const sourcePath = path.resolve(
  "lemichu_전처리공유_2026_08_23",
  "5_전체번역",
  "translated_products.jsonl"
);
const shouldWrite = process.argv.includes("--write");
const expectedProject =
  process.env.FIREBASE_TARGET_PROJECT_ID || "lemichu-25c26";

async function* readDocuments() {
  const lines = readline.createInterface({
    input: createReadStream(sourcePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  for await (const line of lines) {
    if (!line.trim()) continue;
    yield JSON.parse(line);
  }
}

async function validateSource() {
  const ids = new Set();
  let products = 0;
  let options = 0;
  let eligible = 0;
  for await (const document of readDocuments()) {
    if (!/^buyma-\d+$/.test(document.id)) {
      throw new Error(`Invalid document id: ${document.id}`);
    }
    if (ids.has(document.id)) throw new Error(`Duplicate document id: ${document.id}`);
    ids.add(document.id);
    if (document.translationMeta?.status !== "complete") {
      throw new Error(`Incomplete translation: ${document.id}`);
    }
    products += 1;
    options += document.sourceOptions?.length ?? 0;
    if (document.eligibleForOperations) eligible += 1;
  }
  if (products !== 5_099 || options !== 27_462 || eligible !== 1_342) {
    throw new Error(
      `Source count mismatch: products=${products}, options=${options}, eligible=${eligible}`
    );
  }
  return { products, options, eligible };
}

async function main() {
  const summary = await validateSource();
  console.log(
    `[buyma-full-translation] validated products=${summary.products} options=${summary.options} eligible=${summary.eligible}`
  );
  if (!shouldWrite) {
    console.log("[buyma-full-translation] dry run complete; pass --write to import");
    return;
  }

  const { db, projectId } = getFirebaseAdminServices();
  assertExpectedProject(projectId, expectedProject);
  const writer = db.bulkWriter({
    throttling: { initialOpsPerSecond: 100, maxOpsPerSecond: 400 },
  });
  writer.onWriteError((error) => {
    if (error.failedAttempts < 5) return true;
    console.error(
      `[buyma-full-translation] write failed ${error.documentRef.path}: ${error.message}`
    );
    return false;
  });

  let scheduled = 0;
  for await (const document of readDocuments()) {
    const { id, ...data } = document;
    writer.set(db.collection(COLLECTION).doc(id), {
      ...data,
      sourceProductId: id.replace(/^buyma-/, ""),
      updatedAt: FieldValue.serverTimestamp(),
    });
    scheduled += 1;
    if (scheduled % 250 === 0) {
      console.log(`[buyma-full-translation] scheduled ${scheduled}/${summary.products}`);
    }
  }
  await writer.close();

  const count = await db.collection(COLLECTION).count().get();
  const actualCount = count.data().count;
  if (actualCount !== summary.products) {
    throw new Error(
      `Firestore count mismatch: expected=${summary.products}, actual=${actualCount}`
    );
  }
  console.log(
    `[buyma-full-translation] imported and counted ${actualCount}/${summary.products}`
  );
}

main().catch((error) => {
  console.error(
    `[buyma-full-translation] failed: ${error instanceof Error ? error.message : error}`
  );
  process.exitCode = 1;
});
