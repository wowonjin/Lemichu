import type { Product } from "@/types/product";
import { getProductKind, type ProductKind } from "@/lib/productKind";
import { isVariantAvailable } from "@/lib/product-variants";

export type ProductOption = {
  label: string;
  detail?: string;
};

export type ProductOptionSet = {
  kind: ProductKind;
  sizeLabel: string;
  sizes: ProductOption[];
  colors: ProductOption[];
  sizeGuide: ProductOption[];
};

const bagSizeGuide: ProductOption[] = [
  { label: "PM", detail: "28 x 15 x 34 cm / 약 250g" },
  { label: "MM", detail: "32 x 17 x 37 cm / 약 310g" },
  { label: "GM", detail: "34 x 20 x 40 cm / 약 350g" },
];

function uniqueOptions(options: ProductOption[]): ProductOption[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = option.label.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function asSingle(label?: string, detail?: string): ProductOption[] {
  const value = label?.trim();
  if (!value || value === "상세 옵션 확인") return [];
  return [{ label: value, detail }];
}

export function getProductOptionSet(product: Product): ProductOptionSet {
  const kind = getProductKind(product);
  if (product.variants?.length) {
    const sizes = product.variants.map((variant) => ({
      label: variant.size?.trim() || "단일 사이즈",
      detail: isVariantAvailable(variant) ? undefined : "품절",
    }));
    const colors = product.variants.map((variant) => ({
      label: variant.color?.trim() || "기본 색상",
    }));
    const sizeGuide = product.variants
      .filter((variant) => variant.measurements && Object.keys(variant.measurements).length > 0)
      .map((variant) => ({
        label: variant.size?.trim() || "단일 사이즈",
        detail: Object.entries(variant.measurements ?? {})
          .map(([label, value]) => `${label} ${value}`)
          .join(" · "),
      }));

    return {
      kind,
      sizeLabel: kind === "watch" ? "케이스 사이즈" : "사이즈",
      sizes: uniqueOptions(sizes),
      colors: uniqueOptions(colors),
      sizeGuide: uniqueOptions(sizeGuide),
    };
  }
  const color = asSingle(product.color);
  const size = product.size?.trim();

  if (kind === "watch") {
    return {
      kind,
      sizeLabel: "케이스 사이즈",
      sizes: asSingle(size, "해당 상품 실측 사이즈"),
      colors: color,
      sizeGuide: asSingle(size, "케이스 직경 기준"),
    };
  }

  if (kind === "jewelry") {
    return {
      kind,
      sizeLabel: "사이즈",
      sizes: asSingle(size ?? "단일 사이즈"),
      colors: color,
      sizeGuide: asSingle(size, "호수 또는 길이 기준"),
    };
  }

  if (kind === "shoes") {
    return {
      kind,
      sizeLabel: "사이즈",
      sizes: asSingle(size, "해당 상품 재고 사이즈"),
      colors: color,
      sizeGuide: asSingle(size, "브랜드 표기 사이즈"),
    };
  }

  if (kind === "wallet") {
    return {
      kind,
      sizeLabel: "사이즈",
      sizes: asSingle(size && size !== "단일" ? size : "단일 사이즈"),
      colors: color,
      sizeGuide: [],
    };
  }

  if (kind === "apparel") {
    return {
      kind,
      sizeLabel: "사이즈",
      sizes: asSingle(size),
      colors: color,
      sizeGuide: asSingle(size, "브랜드 표기 사이즈"),
    };
  }

  const isBagFamily = kind === "women-bag" || kind === "men-bag";
  const bagSize = size && bagSizeGuide.some((item) => size === item.label || size.includes(item.label));
  const currentBagSize = bagSize
    ? bagSizeGuide.find((item) => size === item.label || size?.includes(item.label))
    : undefined;

  return {
    kind,
    sizeLabel: "사이즈",
    sizes: currentBagSize ? [currentBagSize] : asSingle(size ?? "단일 사이즈"),
    colors: color,
    sizeGuide: isBagFamily && bagSize ? bagSizeGuide : asSingle(size),
  };
}

export function formatProductOptions(product: Product): ProductOptionSet {
  const set = getProductOptionSet(product);
  return {
    ...set,
    sizes: uniqueOptions(set.sizes),
    colors: uniqueOptions(set.colors),
    sizeGuide: uniqueOptions(set.sizeGuide),
  };
}
