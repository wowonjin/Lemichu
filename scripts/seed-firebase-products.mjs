import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function loadEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index);
    let value = trimmed.slice(index + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function resolveImagePath(id) {
  const candidates = [
    path.resolve("scripts/generated-products", `${id}.png`),
    path.resolve("C:/Users/samsung/.cursor/projects/c-Lemichu-main/assets", `${id}.png`),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function toAsset(url, storagePath, size, width, height, contentType = "image/png") {
  return {
    url,
    path: storagePath,
    width,
    height,
    contentType,
    size,
  };
}

loadEnv();

const catalog = JSON.parse(readFileSync("scripts/product-seed-data.json", "utf8"));
const sa = JSON.parse(readFileSync("lemichu-25c26-firebase-adminsdk-fbsvc-dbcf2e861c.json", "utf8"));
const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "lemichu-25c26.firebasestorage.app";

const app =
  getApps()[0] ||
  initializeApp({
    credential: cert(sa),
    projectId: sa.project_id,
    storageBucket: bucketName,
  });

const db = getFirestore(app);
const bucket = getStorage(app).bucket();

const results = [];

for (const product of catalog) {
  const imagePath = resolveImagePath(product.id);
  if (!imagePath) {
    throw new Error(`Missing generated image for ${product.id}`);
  }

  const buffer = readFileSync(imagePath);
  const token = randomUUID();
  const directory = `products/seed-${product.id}`;
  const storagePath = `${directory}/0-${product.id}/original.png`;

  await bucket.file(storagePath).save(buffer, {
    resumable: false,
    metadata: {
      contentType: "image/png",
      cacheControl: "public,max-age=31536000,immutable",
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
  const variant = toAsset(url, storagePath, buffer.length, 1024, 1024);
  const representativeImage = {
    original: variant,
    thumbnail: variant,
    medium: variant,
    alt: `${product.brand} ${product.name}`,
  };

  await db.collection("products").doc(product.id).set({
    name: product.name,
    brand: product.brand,
    color: product.color,
    size: product.size,
    salePrice: product.salePrice,
    retailPrice: product.retailPrice,
    stockQuantity: product.stockQuantity,
    representativeImageUrl: url,
    optionalImageUrls: [],
    representativeImage,
    optionalImages: [],
    detailContent: `<p>${product.brand} ${product.name}은(는) LEMICHU 검수 기준에 맞춰 등록된 상품입니다. 색상 ${product.color}, 사이즈 ${product.size}.</p>`,
    leafCategoryId: "50000837",
    originAreaCode: "0200037",
    deliveryFee: product.deliveryFee,
    afterServiceTelephoneNumber: "1600-0000",
    afterServiceGuideContent: "평일 10:00~18:00 고객센터 운영",
    storeCategoryId: product.storeCategoryId,
    isPreOwned: Boolean(product.isPreOwned),
    todayShip: Boolean(product.todayShip),
    naverSync: { status: "skipped" },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  results.push({ id: product.id, url });
  console.log(`seeded ${product.id}`);
}

console.log(`SEEDED ${results.length} products`);
