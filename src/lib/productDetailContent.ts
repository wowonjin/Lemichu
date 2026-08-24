import type { Product } from "@/types/product";
import type { ProductOption } from "@/lib/productOptions";

export type ProductSpecRow = {
  label: string;
  value: string;
};

export type ParsedProductDetail = {
  summary: string[];
  specs: ProductSpecRow[];
  features: string[];
  isRichHtml: boolean;
};

const LABEL_ALIASES: Record<string, string> = {
  상품명: "상품명",
  제품명: "상품명",
  시즌: "시즌",
  모델: "모델",
  스타일: "모델",
  "스타일 코드": "모델",
  품번: "모델",
  "상품 품번": "모델",
  "제품 코드": "모델",
  "상품 코드": "모델",
  컬러: "색상",
  색상: "색상",
  "디자이너 색상명": "색상",
  "금속 장식 색상": "장식 색상",
  사이즈: "사이즈",
  크기: "사이즈",
  치수: "사이즈",
  소재: "소재",
  "주요 소재": "소재",
  생산국: "원산지",
  원산지: "원산지",
  브랜드: "브랜드",
  카테고리: "카테고리",
  상태: "상태",
  관리법: "관리",
  구성품: "구성",
  부속품: "구성",
  패턴: "패턴",
  "칼라 형태": "칼라",
  "소매 형태": "소매",
  앞여밈: "여밈",
  두께: "두께",
  商品名: "상품명",
  シーズン: "시즌",
  モデル: "모델",
  カラー: "색상",
  サイズ: "사이즈",
  素材: "소재",
  生産国: "원산지",
};

const SUB_FIELD_LABELS = new Set([
  "겉감",
  "안감",
  "표지",
  "머리둘레",
  "챙 길이",
  "챙길이",
  "너비",
  "높이",
  "폭",
  "무게",
  "기장",
  "핸들 길이",
  "핸들 높이",
  "숄더 스트랩 길이",
  "입구 너비",
  "표地",
  "裏地",
]);

const FEATURE_SECTIONS = new Set(["상세 정보", "상세 사양", "구성 및 사양", "사양"]);
const OPEN_SPEC_LABELS = new Set(["사이즈", "소재"]);
const IGNORED_SECTIONS = new Set(["옵션 상세", "상세 설명", "참고"]);
const HIDDEN_SPEC_LABELS = new Set(["상품명", "카테고리", "상품번호"]);
const PLACEHOLDER_VALUES = new Set([
  "f",
  "free",
  "free size",
  "onesize",
  "one size",
  "os",
  "프리",
  "프리사이즈",
  "단일",
  "단일 사이즈",
  "상세 옵션 확인",
  "기본 색상",
]);

const NOISE_PATTERNS = [
  /buyma\.com/i,
  /smartstore\.naver\.com/i,
  /팔로우/,
  /フォロー/,
  /인기 컬렉션/,
  /대폭 할인/,
  /할인 가격으로 안내/,
  /특가 상품/,
  /유럽에서만/,
  /ヨーロッパ/,
  /아울렛/,
  /アウトレット/,
  /직영점/,
  /直営店/,
  /재고 확인/,
  /在庫/,
  /더 보고 싶/,
  /もっと見たい/,
  /아래 링크/,
  /下のリンク/,
  /가장 빠르게 출품/,
  /お買い得/,
  /正真正銘/,
  /이미지\s*\d+\s*번째/,
  /원본 이미지/,
];

const SPEC_ORDER = [
  "브랜드",
  "모델",
  "시즌",
  "색상",
  "장식 색상",
  "사이즈",
  "소재",
  "원산지",
  "상태",
  "관리",
  "구성",
  "상품 구분",
  "상태 등급",
  "배송",
  "관부가세",
];

const DIMENSION_LABELS = /^(머리둘레|챙 길이|챙길이|너비|높이|폭|기장|핸들 길이|핸들 높이)$/;

export function isRichProductDetailHtml(html: string): boolean {
  return /<(img|table|iframe)\b/i.test(html);
}

export function isPlaceholderSpecValue(value?: string | null): boolean {
  return PLACEHOLDER_VALUES.has((value ?? "").trim().toLowerCase());
}

export function parseProductDetailContent(html?: string | null): ParsedProductDetail {
  const source = html?.trim() ?? "";
  const isRichHtml = isRichProductDetailHtml(source);
  if (!source || isRichHtml) {
    return { summary: [], specs: [], features: [], isRichHtml };
  }

  const specs = new Map<string, string[]>();
  const summary: string[] = [];
  const features: string[] = [];
  let currentLabel: string | null = null;
  let awaitingValue = false;
  let featureMode = false;

  const appendSpec = (label: string, value: string) => {
    const cleaned = cleanSpecPart(label, value);
    if (!cleaned) return;
    const existing = specs.get(label) ?? [];
    if (!existing.includes(cleaned)) existing.push(cleaned);
    specs.set(label, existing);
  };

  const closeUnlessOpen = (label: string | null) => {
    currentLabel = label && OPEN_SPEC_LABELS.has(label) ? label : null;
    awaitingValue = false;
  };

  for (const rawLine of htmlToPlainText(source).split("\n")) {
    const line = normalizeWhitespace(rawLine);
    if (!line) continue;

    const stripped = stripDecorators(line);
    if (!stripped || isNoiseLine(line, stripped)) {
      continue;
    }

    const labeled = splitLabeledLine(stripped);
    if (labeled) {
      const alias = LABEL_ALIASES[normalizeLabelName(labeled.label)];
      if (alias) {
        featureMode = false;
        if (labeled.value) {
          if (SUB_FIELD_LABELS.has(labeled.label) && currentLabel) {
            appendSpec(currentLabel, `${labeled.label} ${labeled.value}`);
          } else {
            appendSpec(alias, labeled.value);
            closeUnlessOpen(alias);
          }
        } else {
          currentLabel = alias;
          awaitingValue = true;
        }
        continue;
      }

      if (currentLabel && SUB_FIELD_LABELS.has(labeled.label) && labeled.value) {
        appendSpec(currentLabel, `${labeled.label} ${labeled.value}`);
        awaitingValue = false;
        continue;
      }
    }

    if (FEATURE_SECTIONS.has(stripped)) {
      currentLabel = null;
      awaitingValue = false;
      featureMode = true;
      continue;
    }

    if (IGNORED_SECTIONS.has(stripped)) {
      currentLabel = null;
      awaitingValue = false;
      featureMode = false;
      continue;
    }

    if (currentLabel && awaitingValue) {
      appendSpec(currentLabel, stripped.replace(/^※\s*/, ""));
      closeUnlessOpen(currentLabel);
      continue;
    }

    if (currentLabel && isSpecContinuation(currentLabel, stripped)) {
      appendSpec(currentLabel, stripped.replace(/^※\s*/, ""));
      continue;
    }

    if (looksLikeMeasurement(stripped)) {
      appendSpec("사이즈", stripped);
      currentLabel = "사이즈";
      awaitingValue = false;
      featureMode = false;
      continue;
    }

    if (/들어|수납/.test(stripped) && isUsefulFeature(stripped) && features.length < 12) {
      features.push(stripped);
      continue;
    }

    if (featureMode) {
      if (isUsefulFeature(stripped) && features.length < 12) {
        features.push(stripped);
      }
      continue;
    }

    const intro = extractIntroSentence(stripped);
    if (intro && summary.length < 2 && !summary.includes(intro)) {
      summary.push(intro);
    }
  }

  return {
    summary,
    specs: [...specs.entries()]
      .filter(([label]) => !HIDDEN_SPEC_LABELS.has(label))
      .map(([label, values]) => ({
        label,
        value: values.map((item) => formatSpecValue(label, item)).join(" · "),
      })),
    features,
    isRichHtml,
  };
}

export function getProductDetailSpecRows(
  product: Product,
  parsed: ParsedProductDetail
): ProductSpecRow[] {
  const rows = new Map<string, string>();
  const fallbacks: ProductSpecRow[] = [
    { label: "브랜드", value: product.brand },
    { label: "상품 구분", value: product.isPreOwned ? "중고명품" : "신상품" },
    ...(product.isPreOwned
      ? [{ label: "상태 등급", value: product.condition ?? "A" }]
      : []),
    { label: "색상", value: product.color ?? "상세 옵션 확인" },
    { label: "사이즈", value: product.size ?? "단일 사이즈" },
    { label: "배송", value: product.deliveryBadge },
    { label: "관부가세", value: "상품가 포함" },
  ];

  for (const row of fallbacks) {
    if (row.value) rows.set(row.label, row.value);
  }

  for (const spec of parsed.specs) {
    const current = rows.get(spec.label);
    if (!current || isPlaceholderSpecValue(current) || spec.value.length > current.length) {
      rows.set(spec.label, spec.value);
    }
  }

  const ordered: ProductSpecRow[] = [];
  for (const label of SPEC_ORDER) {
    const value = rows.get(label);
    if (value && !isPlaceholderSpecValue(value)) {
      ordered.push({ label, value });
    }
    rows.delete(label);
  }

  for (const [label, value] of rows) {
    if (value && !isPlaceholderSpecValue(value)) {
      ordered.push({ label, value });
    }
  }

  return ordered;
}

export function getProductSizeGuideRows(
  sizeGuide: ProductOption[],
  parsed: ParsedProductDetail
): ProductSpecRow[] {
  const parsedSize = parsed.specs.find((spec) => spec.label === "사이즈")?.value;
  const extractedSize = parsedSize?.match(/\(([A-Za-z0-9]+)\)/)?.[1];

  return sizeGuide.map((size) => {
    const label = isPlaceholderSpecValue(size.label)
      ? extractedSize ?? "실측"
      : size.label;
    return {
      label,
      value: formatMeasurementDetail(size.detail ?? "해당 상품 사이즈"),
    };
  });
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/\r/g, "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/(?:p|div|h[1-6]|li|tr|blockquote)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n");
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/[：]/g, ":")
    .replace(/[　\t]+/g, " ")
    .replace(/ｃｍ/gi, "cm")
    .replace(/％/g, "%")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripDecorators(line: string): string {
  return line
    .replace(/^[\s★☆◆■●＊*·•・※＞>\-–—]+/, "")
    .replace(/[\s★☆◆■●＊*·•・]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isNoiseLine(line: string, stripped: string): boolean {
  if (/^https?:\/\//i.test(stripped)) return true;
  if (/^(재고|옵션 상세|sale|miumiu|lemichu)$/i.test(stripped)) return true;
  return NOISE_PATTERNS.some((pattern) => pattern.test(line) || pattern.test(stripped));
}

function normalizeLabelName(label: string): string {
  return label.replace(/\s*\((?:cm|㎝)\)\s*$/i, "").trim();
}

function splitLabeledLine(line: string): { label: string; value: string } | null {
  const match = line.match(/^(.{1,16}?)\s*:\s*(.*)$/);
  if (match) {
    return { label: match[1].trim(), value: match[2].trim() };
  }
  const normalized = normalizeLabelName(line);
  if (LABEL_ALIASES[normalized]) {
    return { label: normalized, value: "" };
  }
  return null;
}

function isSpecContinuation(label: string, line: string): boolean {
  if (SUB_FIELD_LABELS.has(splitLabeledLine(line)?.label ?? "")) return true;
  if (label === "사이즈") return looksLikeMeasurement(line) || line.includes("조절");
  if (label === "소재") return line.length <= 80;
  return false;
}

function looksLikeMeasurement(line: string): boolean {
  if (line.length > 60 || /모델 신장|착용 사이즈|들어|수납|참조/.test(line)) return false;
  return (
    /[WHD]\s*\d+/i.test(line) ||
    /\d+\s*[×x]\s*\d+/.test(line) ||
    /^(너비|높이|폭|옆폭|기장|머리둘레|챙)\b/.test(line) ||
    (/(\d+(?:\.\d+)?)\s*(cm|㎝)\b/i.test(line) && /너비|높이|폭|기장|둘레|길이/.test(line))
  );
}

function isUsefulFeature(line: string): boolean {
  if (line.length < 2 || line.length > 140) return false;
  if (/[:：]\s*$/.test(line) && line.length <= 8) return false;
  if (/참조|이미지/.test(line)) return false;
  return true;
}

function extractIntroSentence(line: string): string | null {
  if (line.length < 8 || /[:/]/.test(line) || isNoiseLine(line, line)) return null;
  const sentence = line.match(/^.*?입니다\.?/)?.[0];
  if (!sentence || sentence.length > 90) return null;
  return sentence.endsWith(".") ? sentence : `${sentence}.`;
}

function cleanSpecPart(label: string, value: string): string {
  let next = normalizeWhitespace(value)
    .replace(/^※\s*/, "")
    .replace(/made\s*in\s*italy/i, "이탈리아")
    .replace(/머리둘레\s*:?\s*(\d+(?:\.\d+)?)\s*cm\s*[【[]\s*([A-Za-z0-9]+)\s*[】\]]\s*머리둘레/i, "머리둘레 $1cm ($2)")
    .replace(/[【[]\s*([A-Za-z0-9]+)\s*[】\]]/g, "($1)")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (label === "시즌") {
    next = next.replace(/\s*신작$/, "").trim();
  }

  if (label === "원산지") {
    next = next.replace(/\s*생산$/, "").replace(/^made\s*in\s*/i, "").trim();
    if (/^italy$/i.test(next)) next = "이탈리아";
  }

  const dimension = next.match(/^(.+?)\s*:?\s*(\d+(?:\.\d+)?)\s*(cm)?$/i);
  if (dimension && DIMENSION_LABELS.test(dimension[1].trim()) && !dimension[3]) {
    next = `${dimension[1].trim()} ${dimension[2]}cm`;
  }

  return next;
}

function formatSpecValue(label: string, value: string): string {
  if (label === "원산지" && /^italy$/i.test(value)) return "이탈리아";
  return value;
}

function formatMeasurementDetail(detail: string): string {
  return detail.replace(/(\d+(?:\.\d+)?)(?!\s*cm)\b/gi, "$1cm");
}
