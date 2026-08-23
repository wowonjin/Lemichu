import { readFileSync } from "node:fs";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { STAGING_COLLECTION } from "./lib/buyma-staging.mjs";
import {
  assertExpectedProject,
  getFirebaseAdminServices,
} from "./lib/firebase-admin.mjs";

const shouldWrite = process.argv.includes("--write");
const expectedProject =
  process.env.FIREBASE_TARGET_PROJECT_ID || "lemichu-25c26";
const canarySourcePath = path.resolve(
  "lemichu_전처리공유_2026_08_23",
  "2_중간산출물_테스트셋30건",
  "staging_products.json"
);
const categoryMapPath = path.resolve(
  "lemichu_전처리공유_2026_08_23",
  "4_코드",
  "buyma_category_map.csv"
);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function detailHtml(staging) {
  const paragraphs = String(staging.descriptionKo ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`);
  const optionLines = String(staging.optionSupplementKo ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean)
    .map((line) => `<li>${escapeHtml(line)}</li>`);
  return [
    ...paragraphs,
    optionLines.length > 0
      ? `<h3>옵션 상세</h3><ul>${optionLines.join("")}</ul>`
      : "",
  ].join("");
}

function loadCategoryNames() {
  const lines = readFileSync(categoryMapPath, "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(1);
  return new Map(
    lines.map((line) => {
      const [code, name] = line.split(",");
      return [code, name];
    })
  );
}

function storeCategoryId(staging, categoryNames) {
  const [depth1, depth2 = ""] = String(staging.categoryPath ?? "").split(">");
  if (depth2.includes("시계")) return "watches";
  if (depth1 === "가방") {
    const buymaName = categoryNames.get(String(staging.buymaCategory)) ?? "";
    return buymaName.includes("(M)") ? "men-bags" : "women-bags";
  }
  if (depth1 === "지갑·소품") return "wallets";
  if (depth1 === "신발") return "shoes";
  if (depth1 === "액세서리") return "jewelry";
  return "apparel";
}

function stockQuantity(variants) {
  return variants.reduce((total, variant) => {
    if (variant.stockStatus === "soldout") return total;
    if (variant.stockStatus === "quantity_managed") {
      return total + Math.max(Number(variant.quantity ?? 0), 0);
    }
    return total + 1;
  }, 0);
}

function toProductDocument(staging, categoryNames, existing) {
  const variants = Array.isArray(staging.variants) ? staging.variants : [];
  const representativeVariant =
    variants.find((variant) => variant.stockStatus !== "soldout") ?? variants[0];
  return {
    name: staging.name,
    brand: staging.brandKo,
    color: representativeVariant?.color ?? null,
    size: representativeVariant?.size ?? null,
    variants,
    salePrice: staging.baseSalePrice,
    retailPrice: staging.retailPrice ?? null,
    stockQuantity: stockQuantity(variants),
    representativeImageUrl: staging.representativeImageUrl,
    optionalImageUrls: staging.optionalImageUrls ?? [],
    optionalImages: [],
    detailContent: detailHtml(staging),
    leafCategoryId: "",
    originAreaCode: "",
    deliveryFee: 0,
    afterServiceTelephoneNumber: "",
    afterServiceGuideContent: "상품 및 배송 문의는 LEMICHU 고객센터를 이용해 주세요.",
    storeCategoryId: storeCategoryId(staging, categoryNames),
    isPreOwned: false,
    todayShip: false,
    overseasShipping: true,
    naverSync: { status: "skipped" },
    source: {
      system: "buyma",
      stagingCollection: STAGING_COLLECTION,
      sourceProductId: staging.sourceProductId,
      sourceHash: staging.sourceHash,
      imageStatus: "external_url",
    },
    createdAt: existing?.get("createdAt") ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function main() {
  const canaryCodes = JSON.parse(readFileSync(canarySourcePath, "utf8")).map(
    (product) => product.custom_product_code
  );
  if (canaryCodes.length !== 30 || new Set(canaryCodes).size !== 30) {
    throw new Error(`Expected 30 unique canary codes, received ${canaryCodes.length}`);
  }

  const { db, projectId } = getFirebaseAdminServices();
  assertExpectedProject(projectId, expectedProject);
  const stagingRefs = canaryCodes.map((code) =>
    db.collection(STAGING_COLLECTION).doc(code)
  );
  const productRefs = canaryCodes.map((code) => db.collection("products").doc(code));
  const [stagingDocs, existingProducts] = await Promise.all([
    db.getAll(...stagingRefs),
    db.getAll(...productRefs),
  ]);
  const missing = stagingDocs.filter((doc) => !doc.exists).map((doc) => doc.id);
  if (missing.length > 0) {
    throw new Error(`Missing staging canary documents: ${missing.join(", ")}`);
  }
  const blocked = stagingDocs
    .filter(
      (doc) =>
        !doc.get("descriptionKo") ||
        doc.get("promotionStatus") === "translation_required"
    )
    .map((doc) => doc.id);
  if (blocked.length > 0) {
    throw new Error(`Canary translation gate failed: ${blocked.join(", ")}`);
  }

  console.log(
    `[buyma-promote] project=${projectId} canary=${canaryCodes.length} existing=${existingProducts.filter((doc) => doc.exists).length}`
  );
  if (!shouldWrite) {
    console.log("[buyma-promote] dry run complete; pass --write to promote");
    return;
  }

  const categoryNames = loadCategoryNames();
  const batch = db.batch();
  stagingDocs.forEach((stagingDoc, index) => {
    batch.set(
      productRefs[index],
      toProductDocument(stagingDoc.data(), categoryNames, existingProducts[index])
    );
  });
  await batch.commit();

  const promoted = await db.getAll(...productRefs);
  const failures = promoted.filter((doc, index) => {
    if (!doc.exists) return true;
    const staging = stagingDocs[index].data();
    return (
      doc.get("name") !== staging.name ||
      doc.get("variants")?.length !== staging.variants?.length ||
      doc.get("representativeImageUrl") !== staging.representativeImageUrl
    );
  });
  if (failures.length > 0) {
    throw new Error(
      `Promotion verification failed: ${failures.map((doc) => doc.id).join(", ")}`
    );
  }
  console.log(`[buyma-promote] promoted and verified ${promoted.length}/30`);
}

main().catch((error) => {
  console.error(`[buyma-promote] failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
