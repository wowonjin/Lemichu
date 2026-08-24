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
const excelPath = path.resolve("LEMICHU_번개장터_상품데이터_34개.xlsx");
const parserPath = path.resolve("scripts/lib/parse-bunjang-excel.py");

const BRAND_ALIASES = new Map([
  ["메종마르지엘라", "메종 마르지엘라"],
  ["입생로랑", "생로랑"],
  ["생 로랑", "생로랑"],
  ["미우 미우", "미우미우"],
]);

const COLOR_KEYWORDS = [
  "핑크베이지",
  "로즈드방",
  "청록색",
  "내추럴",
  "이클립스",
  "베이지",
  "그레이",
  "브라운",
  "블랙",
  "화이트",
  "네이비",
  "골드",
  "피치",
  "탄",
];

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
    throw new Error("No Bunjang products found in the Excel file");
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

function inferColor(product) {
  const explicit = String(product.colorRaw ?? "").trim();
  if (explicit) return explicit;
  const hay = `${product.name} ${product.keywords}`;
  return COLOR_KEYWORDS.find((color) => hay.includes(color)) ?? "";
}

function inferSize(product) {
  const explicit = String(product.sizeRaw ?? "").trim();
  const name = String(product.name ?? "");
  const namedSize = name.match(/\b(xxs|xs|s|m|l|xl|xxl|mm|pm|gm)\b/i)?.[1];
  if (/^(os|free|프리|프리사이즈)$/i.test(explicit)) {
    return namedSize ? namedSize.toUpperCase() : "OS";
  }
  return explicit || (namedSize ? namedSize.toUpperCase() : "");
}

function inferCondition(product) {
  const grade = String(product.gradeRaw ?? "").trim().toUpperCase();
  if (grade === "N" || grade === "NEW" || grade === "N급") return "NEW";
  if (grade === "S" || grade === "S급") return "S";
  if (grade === "A" || grade === "A급" || grade === "AB" || grade === "AB급") return "A";
  if (grade === "B" || grade === "B급" || grade === "B+") return "B";

  const name = String(product.name ?? "");
  if (/새상품|N급/i.test(name)) return "NEW";
  if (/S급/i.test(name)) return "S";
  if (/AB급/i.test(name)) return "A";
  if (/A급/i.test(name)) return "A";
  if (/B급/i.test(name)) return "B";
  return "A";
}

function storeCategoryId(product) {
  const category = String(product.categoryRaw ?? "").toLowerCase();
  const hay = `${product.name} ${product.categoryRaw}`.toLowerCase();
  if (category.includes("wallet") || hay.includes("지갑") || hay.includes("카드")) {
    return "wallets";
  }
  if (
    category.includes("t -shirt") ||
    category.includes("t-shirt") ||
    hay.includes("티셔츠") ||
    hay.includes("셔츠")
  ) {
    return "apparel";
  }
  if (hay.includes("남성") || hay.includes("men")) return "men-bags";
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

function specItems(product, mapped) {
  return [
    ["상품명", product.name],
    ["브랜드", mapped.brand],
    ["상태 등급", conditionLabel(mapped.condition)],
    ["색상", mapped.color],
    ["사이즈", mapped.size],
    ["구성품", product.accessories],
  ].filter(([, value]) => Boolean(value));
}

function detailHtml(product, mapped) {
  const intro = [
    "<p>LEMICHU에서 상태 확인 후 등록한 중고명품입니다. 주문 전 색상, 사이즈, 구성품과 상세 사진을 확인해 주세요.</p>",
    mapped.condition === "NEW"
      ? "<p>미사용 새상품으로 보관된 중고 매입분입니다.</p>"
      : `<p>${conditionLabel(mapped.condition)}로 검수 안내된 상품이며, 사용감은 상세 사진 기준으로 확인할 수 있습니다.</p>`,
  ];
  const specs = specItems(product, mapped)
    .flatMap(([label, value]) => [`<li>■${escapeHtml(label)}</li>`, `<li>${escapeHtml(value)}</li>`])
    .join("");
  const cleaned = cleanDetailSource(product.detailSource)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((block) => `<p>${escapeHtml(block).replaceAll("\n", "<br />")}</p>`);
  return [
    ...intro,
    specs ? `<h3>옵션 상세</h3><ul>${specs}</ul>` : "",
    ...cleaned,
    "<p>가품 판정 시 결제금액 200%를 보상합니다. 상품 옵션과 구성품은 구매 전 문의할 수 있습니다.</p>",
  ]
    .filter(Boolean)
    .join("");
}

function mapProduct(product) {
  const id = `bunjang-${product.sourceProductId}`;
  const brand = normalizeBrand(product.brand);
  const color = inferColor(product);
  const size = inferSize(product);
  const condition = inferCondition(product);
  const stockQuantity = Math.max(Number(product.stockQuantity) || 1, 1);
  const images = (product.images ?? []).filter(Boolean);
  if (!product.name) throw new Error(`Missing name: ${id}`);
  if (!brand) throw new Error(`Missing brand: ${id}`);
  if (!(Number(product.salePrice) > 0)) throw new Error(`Invalid price: ${id}`);
  if (images.length === 0) throw new Error(`Missing images: ${id}`);

  const mapped = { brand, color, size, condition };
  return {
    id,
    document: {
      name: product.name,
      brand,
      color: color || null,
      size: size || null,
      variants: [
        {
          id: `${id}-v001`,
          color: color || null,
          size: size || null,
          surchargeKrw: 0,
          stockStatus: "quantity_managed",
          quantity: stockQuantity,
          measurements: {},
        },
      ],
      salePrice: Number(product.salePrice),
      retailPrice: null,
      stockQuantity,
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
      naverSync: { status: "skipped" },
      source: {
        system: "bunjang",
        sourceProductId: product.sourceProductId,
        sourceUrl: product.sourceUrl || null,
        imageStatus: "external_url",
      },
    },
  };
}

async function main() {
  const products = loadExcelProducts();
  const mapped = products.map(mapProduct);
  const ids = mapped.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate Bunjang product IDs");
  }

  const { db, projectId } = getFirebaseAdminServices();
  assertExpectedProject(projectId, expectedProject);
  const refs = ids.map((id) => db.collection("products").doc(id));
  const existing = await db.getAll(...refs);
  const existingCount = existing.filter((doc) => doc.exists).length;

  console.log(
    `[bunjang-import] project=${projectId} products=${mapped.length} existing=${existingCount}`
  );
  for (const item of mapped) {
    console.log(
      `[bunjang-import] ${item.id} ${item.document.brand} ${item.document.condition} ${item.document.storeCategoryId} ${item.document.salePrice} img=${1 + item.document.optionalImageUrls.length}`
    );
  }

  if (!shouldWrite) {
    console.log("[bunjang-import] dry run complete; pass --write to persist");
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
  const failures = written.filter((doc, index) => {
    if (!doc.exists) return true;
    const expected = mapped[index].document;
    return (
      doc.get("isPreOwned") !== true ||
      doc.get("name") !== expected.name ||
      doc.get("condition") !== expected.condition ||
      doc.get("representativeImageUrl") !== expected.representativeImageUrl
    );
  });
  if (failures.length > 0) {
    throw new Error(
      `Import verification failed: ${failures.map((doc) => doc.id).join(", ")}`
    );
  }
  console.log(`[bunjang-import] wrote and verified ${written.length}/${mapped.length}`);
}

main().catch((error) => {
  console.error(
    `[bunjang-import] failed: ${error instanceof Error ? error.message : error}`
  );
  process.exitCode = 1;
});
