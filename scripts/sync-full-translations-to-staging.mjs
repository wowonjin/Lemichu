import { createReadStream } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { FieldValue } from "firebase-admin/firestore";
import { STAGING_COLLECTION } from "./lib/buyma-staging.mjs";
import {
  assertExpectedProject,
  getFirebaseAdminServices,
} from "./lib/firebase-admin.mjs";

const sourcePath = path.resolve(
  "lemichu_전처리공유_2026_08_23",
  "5_전체번역",
  "translated_products.jsonl"
);
const shouldWrite = process.argv.includes("--write");
const expectedProject =
  process.env.FIREBASE_TARGET_PROJECT_ID || "lemichu-25c26";
const CHUNK_SIZE = 20;

async function loadEligibleTranslations() {
  const products = new Map();
  const lines = readline.createInterface({
    input: createReadStream(sourcePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  for await (const line of lines) {
    if (!line.trim()) continue;
    const product = JSON.parse(line);
    if (!product.eligibleForOperations) continue;
    products.set(product.id, product);
  }
  if (products.size !== 1_342) {
    throw new Error(`Expected 1,342 eligible translations, received ${products.size}`);
  }
  return products;
}

function translatedVariant(stagingVariant, source, index) {
  const translated = source.translatedOptions[index];
  if (!translated) {
    throw new Error(`Missing translated option ${source.id} index=${index}`);
  }
  return {
    ...stagingVariant,
    color: String(translated["色名称"] ?? "").trim() || stagingVariant.color,
    colorOriginal:
      String(source.sourceOptions[index]?.["色名称"] ?? "").trim() ||
      stagingVariant.colorOriginal,
    size: String(translated["サイズ名称"] ?? "").trim() || stagingVariant.size,
  };
}

function stagingPatch(staging, source) {
  const variants = Array.isArray(staging.variants) ? staging.variants : [];
  if (
    variants.length !== source.sourceOptions.length ||
    variants.length !== source.translatedOptions.length
  ) {
    throw new Error(
      `Variant count mismatch ${source.id}: staging=${variants.length}, source=${source.sourceOptions.length}, translated=${source.translatedOptions.length}`
    );
  }
  const descriptionKo = String(source.translatedProduct["商品コメント"] ?? "").trim();
  if (!descriptionKo) throw new Error(`Missing translated description: ${source.id}`);
  return {
    name: String(source.translatedProduct["商品名"] ?? "").trim(),
    nameOriginal: String(source.sourceProduct["商品名"] ?? "").trim(),
    descriptionKo,
    descriptionSource: String(source.sourceProduct["商品コメント"] ?? "").trim(),
    optionSupplementKo: String(
      source.translatedProduct["色サイズ補足"] ?? ""
    ).trim(),
    optionSupplementSource: String(source.sourceProduct["色サイズ補足"] ?? "").trim(),
    variants: variants.map((variant, index) =>
      translatedVariant(variant, source, index)
    ),
    promotionStatus:
      staging.storageImages?.every((image) => Boolean(image?.path))
        ? "ready_for_review"
        : "storage_required",
    translationSourceRef: `buyma_translated_source/${source.id}`,
    fullTranslationMeta: source.translationMeta,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function main() {
  const translations = await loadEligibleTranslations();
  const { db, projectId } = getFirebaseAdminServices();
  assertExpectedProject(projectId, expectedProject);
  const entries = [...translations.entries()];
  let validated = 0;
  let missing = [];

  for (let offset = 0; offset < entries.length; offset += CHUNK_SIZE) {
    const chunk = entries.slice(offset, offset + CHUNK_SIZE);
    const refs = chunk.map(([id]) => db.collection(STAGING_COLLECTION).doc(id));
    const snapshots = await db.getAll(...refs);
    const batch = db.batch();
    snapshots.forEach((snapshot, index) => {
      const [id, source] = chunk[index];
      if (!snapshot.exists) {
        missing.push(id);
        return;
      }
      const patch = stagingPatch(snapshot.data(), source);
      if (shouldWrite) batch.update(snapshot.ref, patch);
      validated += 1;
    });
    if (shouldWrite && snapshots.some((snapshot) => snapshot.exists)) {
      await batch.commit();
    }
    if (validated % 200 < CHUNK_SIZE) {
      console.log(
        `[buyma-translation-sync] ${shouldWrite ? "synced" : "validated"} ${validated}/${entries.length}`
      );
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing staging documents (${missing.length}): ${missing.slice(0, 20)}`);
  }
  if (!shouldWrite) {
    console.log("[buyma-translation-sync] dry run complete; pass --write to sync");
    return;
  }

  let verified = 0;
  for (let offset = 0; offset < entries.length; offset += CHUNK_SIZE) {
    const chunk = entries.slice(offset, offset + CHUNK_SIZE);
    const refs = chunk.map(([id]) => db.collection(STAGING_COLLECTION).doc(id));
    const snapshots = await db.getAll(...refs);
    snapshots.forEach((snapshot, index) => {
      const [, source] = chunk[index];
      if (
        snapshot.get("fullTranslationMeta.translationHash") !==
          source.translationMeta.translationHash ||
        snapshot.get("name") !== source.translatedProduct["商品名"] ||
        snapshot.get("variants")?.length !== source.translatedOptions.length
      ) {
        throw new Error(`Post-write verification failed: ${snapshot.id}`);
      }
      verified += 1;
    });
  }
  console.log(`[buyma-translation-sync] synced and verified ${verified}/1342`);
}

main().catch((error) => {
  console.error(
    `[buyma-translation-sync] failed: ${error instanceof Error ? error.message : error}`
  );
  process.exitCode = 1;
});
