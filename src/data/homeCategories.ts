export const HOME_CATEGORY_COLLECTION = "homeCategories";

export const homeCategoryIds = [
  "women-bags",
  "men-bags",
  "wallets",
  "watches",
  "jewelry",
  "shoes",
  "pre-owned",
  "today-ship",
] as const;

export type HomeCategoryId = (typeof homeCategoryIds)[number];

export type HomeCategoryContentItem = {
  id: string;
  brand: string;
  title: string;
  description: string;
  imageSrc: string;
  priceLabel?: string;
  href?: string;
};

export type HomeCategoryContent = {
  id: HomeCategoryId;
  label: string;
  href: string;
  hint: string;
  description: string;
  imageSrc: string;
  visible: boolean;
  order: number;
  items: HomeCategoryContentItem[];
};

export const storeCategoryOptions = [
  { id: "women-bags", label: "여성가방" },
  { id: "men-bags", label: "남성가방" },
  { id: "wallets", label: "지갑" },
  { id: "watches", label: "시계" },
  { id: "jewelry", label: "주얼리" },
  { id: "shoes", label: "슈즈" },
  { id: "apparel", label: "의류" },
] as const;

export const defaultHomeCategories: HomeCategoryContent[] = [
  {
    id: "women-bags",
    label: "여성가방",
    href: "/category/women-bags",
    hint: "Women's Bags",
    description: "",
    imageSrc: "/category-images/cat-women-bags-cut.png",
    visible: true,
    order: 0,
    items: [],
  },
  {
    id: "men-bags",
    label: "남성가방",
    href: "/category/men-bags",
    hint: "Men's Bags",
    description: "",
    imageSrc: "/category-images/cat-men-bags-cut.png",
    visible: true,
    order: 1,
    items: [],
  },
  {
    id: "wallets",
    label: "지갑",
    href: "/category/wallets",
    hint: "Wallets",
    description: "",
    imageSrc: "/category-images/cat-wallets-cut.png",
    visible: true,
    order: 2,
    items: [],
  },
  {
    id: "watches",
    label: "시계",
    href: "/category/watches",
    hint: "Watches",
    description: "",
    imageSrc: "/category-images/cat-watches-cut.png",
    visible: true,
    order: 3,
    items: [],
  },
  {
    id: "jewelry",
    label: "주얼리",
    href: "/category/jewelry",
    hint: "Jewelry",
    description: "",
    imageSrc: "/category-images/cat-jewelry-cut.png",
    visible: true,
    order: 4,
    items: [],
  },
  {
    id: "shoes",
    label: "슈즈",
    href: "/category/shoes",
    hint: "Shoes",
    description: "",
    imageSrc: "/category-images/cat-shoes-cut.png",
    visible: true,
    order: 5,
    items: [],
  },
  {
    id: "pre-owned",
    label: "중고명품",
    href: "/pre-owned",
    hint: "Pre-owned",
    description: "",
    imageSrc: "/category-images/cat-pre-owned-cut.png",
    visible: true,
    order: 6,
    items: [],
  },
  {
    id: "today-ship",
    label: "오늘출고",
    href: "/new-arrivals",
    hint: "Ship today",
    description: "",
    imageSrc: "/category-images/cat-today-ship-cut.png",
    visible: true,
    order: 7,
    items: [],
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isHomeCategoryId(value: string): value is HomeCategoryId {
  return homeCategoryIds.includes(value as HomeCategoryId);
}

export function toCutoutImageSrc(src: string) {
  if (!src.startsWith("/category-images/")) return src;
  if (src.endsWith("-cut.png")) return src;
  if (src.endsWith(".png")) return src.replace(/\.png$/, "-cut.png");
  return src;
}

export function normalizeHomeCategoryItem(
  value: unknown,
  index: number
): HomeCategoryContentItem | null {
  if (!isRecord(value)) return null;
  const title = asString(value.title).trim();
  const imageSrc = asString(value.imageSrc).trim();
  if (!title || !imageSrc) return null;

  return {
    id: asString(value.id, `item-${index + 1}`),
    brand: asString(value.brand).trim(),
    title,
    description: asString(value.description).trim(),
    imageSrc: toCutoutImageSrc(imageSrc),
    priceLabel: asString(value.priceLabel).trim() || undefined,
    href: asString(value.href).trim() || undefined,
  };
}

export function mergeHomeCategories(
  stored: Array<Record<string, unknown> & { id: string }>
): HomeCategoryContent[] {
  const byId = new Map(stored.map((item) => [item.id, item]));

  return defaultHomeCategories.map((fallback) => {
    const override = byId.get(fallback.id);
    if (!override) return fallback;

    const items = Array.isArray(override.items)
      ? override.items
          .map((item, index) => normalizeHomeCategoryItem(item, index))
          .filter((item): item is HomeCategoryContentItem => Boolean(item))
      : fallback.items;

    return {
      ...fallback,
      label: asString(override.label, fallback.label) || fallback.label,
      href: asString(override.href, fallback.href) || fallback.href,
      hint: asString(override.hint, fallback.hint) || fallback.hint,
      description: asString(override.description, fallback.description),
      imageSrc: toCutoutImageSrc(
        asString(override.imageSrc, fallback.imageSrc) || fallback.imageSrc
      ),
      visible: asBoolean(override.visible, fallback.visible),
      order: asNumber(override.order, fallback.order),
      items,
    };
  });
}

export function getDefaultHomeCategory(
  id: string
): HomeCategoryContent | undefined {
  return isHomeCategoryId(id)
    ? defaultHomeCategories.find((item) => item.id === id)
    : undefined;
}
