import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import {
  FULL_STAGING_SOURCE_PATH,
  STAGING_COLLECTION,
  buildStagingDocument,
  loadStagingProducts,
  mapVariants,
  sourceHash,
} from "./lib/buyma-staging.mjs";
import {
  assertExpectedProject,
  getFirebaseAdminServices,
} from "./lib/firebase-admin.mjs";

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const force = args.has("--force");
const skipImages = args.has("--skip-images");
const fullImport = args.has("--full");
const expectedProject =
  process.env.FIREBASE_TARGET_PROJECT_ID || "lemichu-25c26";

function downloadUrl(bucketName, storagePath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    storagePath
  )}?alt=media&token=${token}`;
}

async function fetchImage(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(45_000),
        headers: { "User-Agent": "LEMICHU-BUYMA-IMPORT/1.0" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") || "image/jpeg";
      if (!contentType.startsWith("image/")) {
        throw new Error(`Unexpected content type ${contentType}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
        throw new Error(`Invalid image size ${buffer.length}`);
      }
      return { buffer, contentType };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 750));
      }
    }
  }
  throw new Error(`Image download failed: ${url} (${lastError?.message ?? lastError})`);
}

async function uploadImage(bucket, bucketName, productCode, sourceUrl, index) {
  const storagePath = `products/import-staging/${productCode}/${String(index + 1).padStart(
    2,
    "0"
  )}.jpg`;
  const file = bucket.file(storagePath);
  const [exists] = await file.exists();

  if (exists && !force) {
    const [metadata] = await file.getMetadata();
    let token = metadata.metadata?.firebaseStorageDownloadTokens;
    if (!token) {
      token = randomUUID();
      await file.setMetadata({
        metadata: { ...(metadata.metadata ?? {}), firebaseStorageDownloadTokens: token },
      });
    }
    return {
      index,
      sourceUrl,
      path: storagePath,
      url: downloadUrl(bucketName, storagePath, token),
      contentType: metadata.contentType ?? "image/jpeg",
      size: Number(metadata.size ?? 0),
    };
  }

  const { buffer, contentType } = await fetchImage(sourceUrl);
  const token = randomUUID();
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000,immutable",
      metadata: {
        firebaseStorageDownloadTokens: token,
        sourceUrl,
        sourceSystem: "buyma",
      },
    },
  });

  return {
    index,
    sourceUrl,
    path: storagePath,
    url: downloadUrl(bucketName, storagePath, token),
    contentType,
    size: buffer.length,
  };
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker())
  );
  return results;
}

async function main() {
  const products = loadStagingProducts(
    fullImport ? FULL_STAGING_SOURCE_PATH : undefined,
    fullImport
      ? { requireTranslations: false, allowPendingTranslations: true }
      : undefined
  );
  const summary = {
    products: products.length,
    variants: products.reduce((sum, product) => sum + mapVariants(product).length, 0),
    images: products.reduce((sum, product) => sum + product.images.length, 0),
  };

  console.log(
    `[buyma-import] validated ${summary.products} products, ${summary.variants} variants, ${summary.images} images`
  );

  if (!shouldWrite) {
    console.log("[buyma-import] dry run complete; pass --write to upload and persist");
    return;
  }

  const { db, bucket, projectId, bucketName } = getFirebaseAdminServices();
  assertExpectedProject(projectId, expectedProject);
  console.log(
    `[buyma-import] target project=${projectId} collection=${STAGING_COLLECTION}`
  );

  if (skipImages) {
    const refs = products.map((product) =>
      db.collection(STAGING_COLLECTION).doc(product.custom_product_code)
    );
    const existingSnapshots = await db.getAll(...refs);
    let written = 0;
    let skipped = 0;

    const batchSize = 20;
    for (let start = 0; start < products.length; start += batchSize) {
      const batch = db.batch();
      const end = Math.min(start + batchSize, products.length);
      for (let index = start; index < end; index += 1) {
        const product = products[index];
        const ref = refs[index];
        const existing = existingSnapshots[index];
        const hash = sourceHash(product);
        if (
          existing.exists &&
          existing.get("sourceHash") === hash &&
          ["complete", "source_preserved"].includes(existing.get("importStatus")) &&
          !force
        ) {
          skipped += 1;
          continue;
        }
        const storageImages = product.images.map((sourceUrl, imageIndex) => ({
          index: imageIndex,
          sourceUrl,
          path: null,
          url: sourceUrl,
          contentType: null,
          size: null,
        }));
        batch.set(ref, {
          ...buildStagingDocument(product, storageImages),
          createdAt: existing.exists
            ? existing.get("createdAt") ?? FieldValue.serverTimestamp()
            : FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        written += 1;
      }
      await batch.commit();
      console.log(`[buyma-import] committed ${end}/${products.length}`);
    }
    console.log(
      `[buyma-import] complete written=${written} skipped=${skipped} total=${products.length}`
    );
    return;
  }

  let written = 0;
  let skipped = 0;
  for (const product of products) {
    const ref = db.collection(STAGING_COLLECTION).doc(product.custom_product_code);
    const existing = await ref.get();
    const hash = sourceHash(product);
    if (
      existing.exists &&
      existing.get("sourceHash") === hash &&
      existing.get("importStatus") === "complete" &&
      !force
    ) {
      skipped += 1;
      console.log(`[buyma-import] skip ${product.custom_product_code} (unchanged)`);
      continue;
    }

    const storageImages = skipImages
      ? product.images.map((sourceUrl, index) => ({
          index,
          sourceUrl,
          path: null,
          url: sourceUrl,
          contentType: null,
          size: null,
        }))
      : await mapWithConcurrency(product.images, 4, (sourceUrl, index) =>
          uploadImage(
            bucket,
            bucketName,
            product.custom_product_code,
            sourceUrl,
            index
          )
        );

    await ref.set({
      ...buildStagingDocument(product, storageImages),
      createdAt: existing.exists
        ? existing.get("createdAt") ?? FieldValue.serverTimestamp()
        : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    written += 1;
    console.log(
      `[buyma-import] wrote ${product.custom_product_code} (${storageImages.length} images)`
    );
  }

  console.log(
    `[buyma-import] complete written=${written} skipped=${skipped} total=${products.length}`
  );
}

main().catch((error) => {
  console.error(`[buyma-import] failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
