import { getFirebaseAdminServices, assertExpectedProject } from "./lib/firebase-admin.mjs";

const { db, projectId } = getFirebaseAdminServices();
assertExpectedProject(projectId);

const snapshot = await db.collection("products").get();
const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
const used = products.filter((product) => product.isPreOwned);
const bunjang = used.filter((product) => product.id.startsWith("bunjang-"));
const grades = bunjang.reduce((acc, product) => {
  acc[product.condition ?? "none"] = (acc[product.condition ?? "none"] ?? 0) + 1;
  return acc;
}, {});
const categories = bunjang.reduce((acc, product) => {
  acc[product.storeCategoryId ?? "none"] = (acc[product.storeCategoryId ?? "none"] ?? 0) + 1;
  return acc;
}, {});
const missingImage = bunjang.filter((product) => !product.representativeImageUrl);
const leftover = bunjang.filter((product) =>
  /번개장터|번개페이|번개톡/.test(String(product.detailContent ?? ""))
);

const imageUrl = bunjang[0]?.representativeImageUrl;
let imageStatus = null;
if (imageUrl) {
  const response = await fetch(imageUrl, {
    headers: { "User-Agent": "LEMICHU-BUNJANG-VERIFY/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  imageStatus = {
    url: imageUrl,
    status: response.status,
    type: response.headers.get("content-type"),
    bytes: Number(response.headers.get("content-length") || 0),
  };
}

console.log(
  JSON.stringify(
    {
      projectId,
      total: products.length,
      used: used.length,
      bunjang: bunjang.length,
      grades,
      categories,
      missingImage: missingImage.map((product) => product.id),
      leftoverMarketplaceCopy: leftover.map((product) => product.id),
      sample: bunjang.slice(0, 3).map((product) => ({
        id: product.id,
        brand: product.brand,
        name: product.name,
        condition: product.condition,
        storeCategoryId: product.storeCategoryId,
        salePrice: product.salePrice,
        images: 1 + (product.optionalImageUrls?.length ?? 0),
      })),
      imageStatus,
    },
    null,
    2
  )
);
process.exit(0);
