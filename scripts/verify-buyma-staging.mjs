import { writeFileSync } from "node:fs";
import path from "node:path";
import {
  FULL_STAGING_SOURCE_PATH,
  STAGING_COLLECTION,
  loadStagingProducts,
  mapVariants,
  sourceHash,
} from "./lib/buyma-staging.mjs";
import {
  assertExpectedProject,
  getFirebaseAdminServices,
} from "./lib/firebase-admin.mjs";

const fullImport = process.argv.includes("--full");
const reportPath = path.resolve(
  "lemichu_전처리공유_2026_08_23",
  fullImport ? "2_중간산출물_전체편입" : "2_중간산출물_테스트셋30건",
  "verify_staging_firestore_report.md"
);
const expectedProject =
  process.env.FIREBASE_TARGET_PROJECT_ID || "lemichu-25c26";
const allowExternalImages = process.argv.includes("--allow-external-images");

async function main() {
  const products = loadStagingProducts(
    fullImport ? FULL_STAGING_SOURCE_PATH : undefined,
    fullImport
      ? { requireTranslations: false, allowPendingTranslations: true }
      : undefined
  );
  const expectedIds = new Set(
    products.map((product) => product.custom_product_code)
  );
  const { db, bucket, projectId } = getFirebaseAdminServices();
  assertExpectedProject(projectId, expectedProject);

  const snapshot = await db.collection(STAGING_COLLECTION).get();
  const actualIds = new Set(snapshot.docs.map((doc) => doc.id));
  const docsById = new Map(snapshot.docs.map((doc) => [doc.id, doc]));
  const failures = [];
  const passes = [];

  for (const actualId of actualIds) {
    if (!expectedIds.has(actualId)) failures.push(`unexpected document ${actualId}`);
  }

  for (const product of products) {
    const code = product.custom_product_code;
    const doc = docsById.get(code);
    if (!doc) {
      failures.push(`${code}: document missing`);
      continue;
    }

    const data = doc.data();
    const expectedHash = sourceHash(product);
    const expectedVariants = mapVariants(product);
    const checks = [
      [data.sourceHash === expectedHash, "sourceHash mismatch"],
      [sourceHash(data.sourceData) === expectedHash, "sourceData is not lossless"],
      [data.name === product.product_name, "translated name mismatch"],
      [data.nameOriginal === product.product_name_original, "original name mismatch"],
      [data.baseSalePrice === product.price, "base price mismatch"],
      [data.retailPrice === product.retail_price, "retail price mismatch"],
      [data.categoryPath === product.category_path, "category mismatch"],
      [data.variants?.length === expectedVariants.length, "variant count mismatch"],
      [
        JSON.stringify(data.sourceImages) === JSON.stringify(product.images),
        "source image list mismatch",
      ],
      [
        data.storageImages?.length === product.images.length,
        "uploaded image count mismatch",
      ],
      [
        data.importStatus === "complete" ||
          (allowExternalImages && data.importStatus === "source_preserved"),
        "import status is not complete",
      ],
    ];

    const failedChecks = checks.filter(([ok]) => !ok).map(([, reason]) => reason);
    for (const image of data.storageImages ?? []) {
      if (!image.path) {
        if (!allowExternalImages) {
          failedChecks.push(`image ${image.index} has no Storage path`);
        }
        continue;
      }
      const [exists] = await bucket.file(image.path).exists();
      if (!exists) failedChecks.push(`Storage object missing: ${image.path}`);
    }

    if (failedChecks.length > 0) {
      failures.push(`${code}: ${failedChecks.join("; ")}`);
    } else {
      passes.push(
        `${code} (variants=${expectedVariants.length}, images=${product.images.length})`
      );
    }
  }

  const expectedVariantCount = products.reduce(
    (sum, product) => sum + product.options.length,
    0
  );
  const expectedImageCount = products.reduce(
    (sum, product) => sum + product.images.length,
    0
  );
  const report = [
    "# Firebase staging 이관 검증",
    "",
    `- 프로젝트: \`${projectId}\``,
    `- 컬렉션: \`${STAGING_COLLECTION}\``,
    `- 기대 상품: ${products.length}`,
    `- 기대 옵션: ${expectedVariantCount}`,
    `- 기대 이미지: ${expectedImageCount}`,
    `- 이미지 검증: ${allowExternalImages ? "원본 URL 보존" : "Firebase Storage 객체"}`,
    `- PASS: ${passes.length}`,
    `- FAIL: ${failures.length}`,
    "",
    "## PASS",
    "",
    ...passes.map((item) => `- ${item}`),
    "",
    "## FAIL",
    "",
    ...(failures.length > 0 ? failures.map((item) => `- ${item}`) : ["- 없음"]),
    "",
  ].join("\n");

  writeFileSync(reportPath, report, "utf8");
  console.log(report);
  console.log(`[buyma-verify] report=${reportPath}`);
  process.exitCode = failures.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`[buyma-verify] failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
