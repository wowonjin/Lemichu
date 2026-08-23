import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const STAGING_COLLECTION = "products_import_staging";
export const STAGING_SOURCE_PATH = path.resolve(
  "lemichu_전처리공유_2026_08_23",
  "2_중간산출물_테스트셋30건",
  "staging_products.json"
);
export const FULL_STAGING_SOURCE_PATH = path.resolve(
  "lemichu_전처리공유_2026_08_23",
  "2_중간산출물_전체편입",
  "staging_products.json"
);
export const TRANSLATIONS_PATH = path.resolve(
  "lemichu_전처리공유_2026_08_23",
  "2_중간산출물_테스트셋30건",
  "product_translations_ko.json"
);

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])])
    );
  }
  return value;
}

export function sourceHash(product) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(product)))
    .digest("hex");
}

export function loadStagingProducts(
  sourcePath = STAGING_SOURCE_PATH,
  {
    requireTranslations = true,
    allowPendingTranslations = false,
    translationsPath = path.join(path.dirname(sourcePath), "product_translations_ko.json"),
  } = {}
) {
  const sourceProducts = JSON.parse(readFileSync(sourcePath, "utf8"));
  if (!Array.isArray(sourceProducts) || sourceProducts.length === 0) {
    throw new Error(`No staging products found in ${sourcePath}`);
  }
  if (requireTranslations && !existsSync(translationsPath)) {
    throw new Error(`Korean translation file is missing: ${translationsPath}`);
  }
  const translations = existsSync(translationsPath)
    ? JSON.parse(readFileSync(translationsPath, "utf8"))
    : {};
  const products = sourceProducts.map((product) => ({
    ...product,
    description_ko:
      translations[product.custom_product_code]?.description_ko ?? "",
    option_supplement_ko:
      translations[product.custom_product_code]?.option_supplement_ko ?? "",
  }));
  const seen = new Set();
  for (const product of products) {
    const code = String(product?.custom_product_code ?? "").trim();
    if (!/^buyma-\d+$/.test(code)) {
      throw new Error(`Invalid custom_product_code: ${code || "(empty)"}`);
    }
    if (seen.has(code)) throw new Error(`Duplicate custom_product_code: ${code}`);
    seen.add(code);
    if (!String(product.product_name ?? "").trim()) {
      throw new Error(`Missing translated product name: ${code}`);
    }
    if (requireTranslations && !String(product.description_ko ?? "").trim()) {
      throw new Error(`Missing translated product description: ${code}`);
    }
    if (
      requireTranslations &&
      String(product.option_supplement_source ?? "").trim() &&
      !String(product.option_supplement_ko ?? "").trim()
    ) {
      throw new Error(`Missing translated option supplement: ${code}`);
    }
    if (product.needs_ai_rewrite && !allowPendingTranslations) {
      throw new Error(`Product name rewrite is still required: ${code}`);
    }
    if (!Array.isArray(product.images) || product.images.length === 0) {
      throw new Error(`Missing images: ${code}`);
    }
    if (!Array.isArray(product.options) || product.options.length === 0) {
      throw new Error(`Missing variants: ${code}`);
    }
    for (const option of product.options) {
      if (
        !["available", "soldout", "quantity_managed"].includes(
          String(option.stock_status)
        )
      ) {
        throw new Error(`Invalid variant stock status: ${code}`);
      }
      if (!Number.isFinite(Number(option.surcharge_krw ?? 0))) {
        throw new Error(`Invalid variant surcharge: ${code}`);
      }
    }
  }
  if (requireTranslations || Object.keys(translations).length > 0) {
    const translationCodes = Object.keys(translations);
    if (
      translationCodes.length !== seen.size ||
      translationCodes.some((code) => !seen.has(code))
    ) {
      throw new Error(
        `Translation key mismatch: products=${seen.size}, translations=${translationCodes.length}`
      );
    }
  }

  return products;
}

export function mapVariants(product) {
  return product.options.map((option, index) => ({
    id: `${product.custom_product_code}-v${String(index + 1).padStart(3, "0")}`,
    color: String(option.color ?? "").trim() || null,
    colorOriginal: String(option.color_original ?? "").trim() || null,
    size: String(option.size ?? "").trim() || null,
    surchargeKrw: Number(option.surcharge_krw ?? 0),
    stockStatus: String(option.stock_status ?? "soldout"),
    quantity:
      option.quantity === null || option.quantity === undefined
        ? null
        : Number(option.quantity),
    measurements: option.measurements ?? {},
  }));
}

export function buildStagingDocument(product, storageImages) {
  const variants = mapVariants(product);
  const availableVariants = variants.filter(
    (variant) =>
      variant.stockStatus === "available" ||
      (variant.stockStatus === "quantity_managed" && (variant.quantity ?? 0) > 0)
  );
  const descriptionKo = String(product.description_ko ?? "").trim() || null;
  const imagesStored = storageImages.every((image) => Boolean(image.path));

  return {
    schemaVersion: 1,
    sourceSystem: "buyma",
    sourceHash: sourceHash(product),
    importStatus: imagesStored ? "complete" : "source_preserved",
    promotionStatus: product.needs_ai_rewrite || !descriptionKo
      ? "translation_required"
      : imagesStored
        ? "ready_for_review"
        : "storage_required",
    customProductCode: product.custom_product_code,
    sourceProductId: product.custom_product_code.replace(/^buyma-/, ""),
    name: product.product_name,
    nameOriginal: product.product_name_original,
    descriptionKo,
    descriptionSource: product.description_source ?? "",
    optionSupplementKo: product.option_supplement_ko ?? "",
    optionSupplementSource: product.option_supplement_source ?? "",
    brandKo: product.brand_ko,
    brandEn: product.brand_en,
    model: product.model,
    buymaCategory: String(product.buyma_category ?? ""),
    categoryPath: product.category_path,
    baseSalePrice: Number(product.price),
    priceJpy: Number(product.price_jpy),
    retailPrice:
      product.retail_price === null || product.retail_price === undefined
        ? null
        : Number(product.retail_price),
    dutyIncluded: Boolean(product.duty_included),
    keywordsCandidate: product.keywords_candidate ?? [],
    tagsRaw: product.tags_raw ?? "",
    variants,
    availableVariantCount: availableVariants.length,
    sourceImages: product.images,
    storageImages,
    representativeImageUrl: storageImages[0]?.url ?? "",
    optionalImageUrls: storageImages.slice(1).map((image) => image.url),
    sourceVisibility: {
      display: product.display ?? "F",
      selling: product.selling ?? "F",
    },
    preprocessingNotes: product.notes ?? [],
    sourceData: product,
  };
}
