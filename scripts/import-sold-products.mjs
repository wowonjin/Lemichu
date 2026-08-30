import { spawnSync } from "node:child_process";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import {
  assertExpectedProject,
  getFirebaseAdminServices,
} from "./lib/firebase-admin.mjs";

const shouldWrite = process.argv.includes("--write");
const expectedProject =
  process.env.FIREBASE_TARGET_PROJECT_ID || "lemichu-25c26";
const excelPath = path.resolve(
  process.argv.find((arg) => arg.endsWith(".xlsx")) || "레미츄_판매완료.xlsx"
);
const parserPath = path.resolve("scripts/lib/parse-sold-excel.py");

const BRAND_ALIASES = new Map([
  ["메종마르지엘라", "메종 마르지엘라"],
  ["입생로랑", "생로랑"],
  ["생 로랑", "생로랑"],
  ["미우 미우", "미우미우"],
  ["보테가베네타", "보테가 베네타"],
]);

function loadExcelProducts() {
  const result = spawnSync("python", [parserPath, excelPath], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  if (result.status !== 0) {
    throw new Error(
      `Failed to parse Excel: ${result.stderr || result.stdout || result.status}`
    );
  }
  const products = JSON.parse(result.stdout);
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("No sold products found in the Excel file");
  }
  return products;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeBrand(value) {
  const brand = String(value ?? "").trim();
  return BRAND_ALIASES.get(brand) || brand;
}

function inferCondition(product) {
  const raw = String(product.conditionRaw ?? "");
  if (/새\s*상품|미사용|N급/i.test(raw)) return "NEW";
  if (/사용감 없음|S급/i.test(raw)) return "S";
  if (/사용감 많|B급/i.test(raw)) return "B";
  if (/사용감 적|A급/i.test(raw)) return "A";
  const name = String(product.name ?? "");
  if (/새상품|N급/i.test(name)) return "NEW";
  if (/S급/i.test(name)) return "S";
  if (/B급/i.test(name)) return "B";
  return "A";
}

function storeCategoryId(product) {
  const hay = `${product.name}`.toLowerCase();
  if (hay.includes("지갑") || hay.includes("카드")) return "wallets";
  if (hay.includes("티셔츠") || hay.includes("셔츠") || hay.includes("니트")) return "apparel";
  if (hay.includes("남성")) return "men-bags";
  return "women-bags";
}

function conditionLabel(grade) {
  if (grade === "NEW") return "새상품";
  if (grade === "S") return "S급";
  if (grade === "B") return "B급";
  return "A급";
}

function cleanDetailSource(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || /^[=\-ㅡ]{3,}$/.test(line)) return false;
      return !/(번개페이|번개톡|번개장터|레미츄 럭셔리)/.test(line);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detailHtml(product, mapped) {
  const intro = [
    "<p>LEMICHU에서 판매가 완료된 중고명품입니다. 비슷한 컨디션의 상품을 찾아보세요.</p>",
    `<p>${conditionLabel(mapped.condition)}로 등록되었던 상품입니다.</p>`,
  ];
  const cleaned = cleanDetailSource(product.detailSource)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((block) => `<p>${escapeHtml(block).replaceAll("\n", "<br />")}</p>`);
  return [...intro, ...cleaned].filter(Boolean).join("");
}

function mapProduct(product) {
  const id = `bunjang-${product.sourceProductId}`;
  const brand = normalizeBrand(product.brand);
  const condition = inferCondition(product);
  const images = (product.images ?? []).filter(Boolean);
  if (!product.name) throw new Error(`Missing name: ${id}`);
  if (!brand) throw new Error(`Missing brand: ${id}`);
  if (!(Number(product.salePrice) > 0)) throw new Error(`Invalid price: ${id}`);
  if (images.length === 0) throw new Error(`Missing images: ${id}`);

  const mapped = { brand, condition };
  return {
    id,
    document: {
      name: product.name,
      brand,
      color: null,
      size: null,
      variants: [
        {
          id: `${id}-v001`,
          color: null,
          size: null,
          surchargeKrw: 0,
          stockStatus: "soldout",
          quantity: 0,
          measurements: {},
        },
      ],
      salePrice: Number(product.salePrice),
      retailPrice: null,
      stockQuantity: 0,
      representativeImageUrl: images[0],
      optionalImageUrls: images.slice(1),
      optionalImages: [],
      detailContent: detailHtml(product, mapped),
      leafCategoryId: "",
      originAreaCode: "02",
      deliveryFee: 0,
      afterServiceTelephoneNumber: "",
      afterServiceGuideContent: "상품 및 배송 문의는 LEMICHU 고객센터를 이용해 주세요.",
      storeCategoryId: storeCategoryId(product),
      isPreOwned: true,
      condition,
      todayShip: false,
      overseasShipping: false,
      availability: "sold",
      naverSync: { status: "skipped" },
      source: {
        system: "bunjang",
        sourceProductId: product.sourceProductId,
        sourceUrl: product.sourceUrl || null,
        imageStatus: "external_url",
        soldStatus: product.statusRaw || "판매완료",
      },
    },
  };
}

async function main() {
  const products = loadExcelProducts();
  const mapped = products.map(mapProduct);
  const ids = mapped.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate sold product IDs");
  }

  const { db, projectId } = getFirebaseAdminServices();
  assertExpectedProject(projectId, expectedProject);
  const refs = ids.map((id) => db.collection("products").doc(id));
  const existing = await db.getAll(...refs);
  const existingCount = existing.filter((doc) => doc.exists).length;

  console.log(
    `[sold-import] project=${projectId} products=${mapped.length} existing=${existingCount} file=${excelPath}`
  );
  for (const item of mapped) {
    console.log(
      `[sold-import] ${item.id} ${item.document.brand} ${item.document.condition} ${item.document.salePrice} img=${1 + item.document.optionalImageUrls.length}`
    );
  }

  if (!shouldWrite) {
    console.log("[sold-import] dry run complete; pass --write to persist");
    return;
  }

  const batch = db.batch();
  mapped.forEach((item, index) => {
    batch.set(refs[index], {
      ...item.document,
      createdAt: existing[index].exists
        ? existing[index].get("createdAt") ?? FieldValue.serverTimestamp()
        : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();

  const written = await db.getAll(...refs);
  const failures = written.filter((doc) => doc.get("availability") !== "sold");
  if (failures.length > 0) {
    throw new Error(
      `Import verification failed: ${failures.map((doc) => doc.id).join(", ")}`
    );
  }
  console.log(`[sold-import] wrote and verified ${written.length}/${mapped.length}`);
}

main().catch((error) => {
  console.error(
    `[sold-import] failed: ${error instanceof Error ? error.message : error}`
  );
  process.exitCode = 1;
});
