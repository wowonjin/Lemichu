import { getProductKind, type ProductKind } from "@/lib/productKind";
import { getProductAvailability, type WishlistRecord } from "@/lib/wishlist";
import type { DeliveryBadge, Product } from "@/types/product";

export const WISHLIST_TABS = [
  "all",
  "price-drop",
  "today-ship",
  "bag",
  "watch",
  "shoes",
  "accessory",
] as const;

export type WishlistTab = (typeof WISHLIST_TABS)[number];

export const WISHLIST_TAB_LABELS: Record<WishlistTab, string> = {
  all: "전체",
  "price-drop": "가격 인하",
  "today-ship": "오늘출고",
  bag: "백",
  watch: "시계",
  shoes: "슈즈",
  accessory: "액세서리",
};

export const WISHLIST_SORTS = [
  "recent",
  "price-asc",
  "price-desc",
  "discount",
  "price-drop",
  "today-ship",
] as const;

export type WishlistSort = (typeof WISHLIST_SORTS)[number];

export const WISHLIST_SORT_LABELS: Record<WishlistSort, string> = {
  recent: "최근 찜한 순",
  "price-asc": "가격 낮은 순",
  "price-desc": "가격 높은 순",
  discount: "할인율 높은 순",
  "price-drop": "가격이 많이 내린 순",
  "today-ship": "오늘출고 우선",
};

export type WishlistAvailabilityFilter = "available" | "soldout" | "sold";
export type WishlistKindFilter = "new" | "preowned";
export type WishlistGradeFilter = "S" | "A" | "B";
export type WishlistPriceFilter = "under-200" | "200-500" | "over-500";

export type WishlistQueryState = {
  tab: WishlistTab;
  sort: WishlistSort;
  status: WishlistAvailabilityFilter | "";
  kind: WishlistKindFilter | "";
  grade: WishlistGradeFilter | "";
  category: WishlistTab | "";
  brand: string;
  price: WishlistPriceFilter | "";
  delivery: DeliveryBadge | "";
  priceDrop: boolean;
};

export type WishlistEntry = {
  product: Product;
  record: WishlistRecord;
};

export const EMPTY_WISHLIST_QUERY: WishlistQueryState = {
  tab: "all",
  sort: "recent",
  status: "",
  kind: "",
  grade: "",
  category: "",
  brand: "",
  price: "",
  delivery: "",
  priceDrop: false,
};

const TAB_KINDS: Record<Exclude<WishlistTab, "all" | "price-drop" | "today-ship">, ProductKind[]> = {
  bag: ["women-bag", "men-bag"],
  watch: ["watch"],
  shoes: ["shoes"],
  accessory: ["wallet", "jewelry", "other"],
};

function isWishlistTab(value: string): value is WishlistTab {
  return (WISHLIST_TABS as readonly string[]).includes(value);
}

function isWishlistSort(value: string): value is WishlistSort {
  return (WISHLIST_SORTS as readonly string[]).includes(value);
}

export function parseWishlistQuery(searchParams: URLSearchParams): WishlistQueryState {
  const tab = searchParams.get("tab") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const status = searchParams.get("status") ?? "";
  const kind = searchParams.get("kind") ?? "";
  const grade = searchParams.get("grade") ?? "";
  const category = searchParams.get("category") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const price = searchParams.get("price") ?? "";
  const delivery = searchParams.get("delivery") ?? "";

  return {
    tab: isWishlistTab(tab) ? tab : "all",
    sort: isWishlistSort(sort) ? sort : "recent",
    status:
      status === "available" || status === "soldout" || status === "sold" ? status : "",
    kind: kind === "new" || kind === "preowned" ? kind : "",
    grade: grade === "S" || grade === "A" || grade === "B" ? grade : "",
    category: isWishlistTab(category) && !["all", "price-drop", "today-ship"].includes(category)
      ? category
      : "",
    brand,
    price: price === "under-200" || price === "200-500" || price === "over-500" ? price : "",
    delivery:
      delivery === "오늘출고" ||
      delivery === "국내배송" ||
      delivery === "해외배송" ||
      delivery === "예약배송"
        ? delivery
        : "",
    priceDrop: searchParams.get("priceDrop") === "1",
  };
}

export function wishlistQueryToSearchParams(query: WishlistQueryState) {
  const params = new URLSearchParams();
  if (query.tab !== "all") params.set("tab", query.tab);
  if (query.sort !== "recent") params.set("sort", query.sort);
  if (query.status) params.set("status", query.status);
  if (query.kind) params.set("kind", query.kind);
  if (query.grade) params.set("grade", query.grade);
  if (query.category) params.set("category", query.category);
  if (query.brand) params.set("brand", query.brand);
  if (query.price) params.set("price", query.price);
  if (query.delivery) params.set("delivery", query.delivery);
  if (query.priceDrop) params.set("priceDrop", "1");
  return params;
}

export function matchesWishlistTab(entry: WishlistEntry, tab: WishlistTab) {
  const { product, record } = entry;
  if (tab === "all") return true;
  if (tab === "price-drop") return record.priceAtAdd > product.price;
  if (tab === "today-ship") return product.deliveryBadge === "오늘출고";
  return TAB_KINDS[tab].includes(getProductKind(product));
}

function matchesPrice(product: Product, range: WishlistPriceFilter | "") {
  if (!range) return true;
  if (range === "under-200") return product.price < 2_000_000;
  if (range === "200-500") return product.price >= 2_000_000 && product.price < 5_000_000;
  return product.price >= 5_000_000;
}

export function filterWishlistEntries(entries: WishlistEntry[], query: WishlistQueryState) {
  return entries.filter((entry) => {
    const { product, record } = entry;
    if (!matchesWishlistTab(entry, query.tab)) return false;
    if (query.priceDrop && !(record.priceAtAdd > product.price)) return false;
    if (query.brand && product.brand !== query.brand) return false;
    if (query.delivery && product.deliveryBadge !== query.delivery) return false;
    if (!matchesPrice(product, query.price)) return false;
    if (query.kind === "new" && product.isPreOwned) return false;
    if (query.kind === "preowned" && !product.isPreOwned) return false;
    if (query.grade && product.condition !== query.grade) return false;
    if (query.category && !matchesWishlistTab(entry, query.category)) return false;

    const availability = getProductAvailability(product);
    if (query.status === "available" && availability !== "available") return false;
    if (query.status === "soldout" && availability !== "temporarily_unavailable") return false;
    if (query.status === "sold" && availability !== "sold") return false;
    return true;
  });
}

export function sortWishlistEntries(entries: WishlistEntry[], sort: WishlistSort) {
  const next = [...entries];
  next.sort((a, b) => {
    if (sort === "price-asc") return a.product.price - b.product.price;
    if (sort === "price-desc") return b.product.price - a.product.price;
    if (sort === "discount") {
      return (b.product.discountRate ?? 0) - (a.product.discountRate ?? 0);
    }
    if (sort === "price-drop") {
      const aDrop = Math.max(0, a.record.priceAtAdd - a.product.price);
      const bDrop = Math.max(0, b.record.priceAtAdd - b.product.price);
      return bDrop - aDrop;
    }
    if (sort === "today-ship") {
      const aToday = a.product.deliveryBadge === "오늘출고" ? 1 : 0;
      const bToday = b.product.deliveryBadge === "오늘출고" ? 1 : 0;
      if (aToday !== bToday) return bToday - aToday;
      return b.record.addedAt - a.record.addedAt;
    }
    return b.record.addedAt - a.record.addedAt;
  });
  return next;
}

export function countWishlistTabs(entries: WishlistEntry[]) {
  return WISHLIST_TABS.reduce(
    (counts, tab) => {
      counts[tab] = entries.filter((entry) => matchesWishlistTab(entry, tab)).length;
      return counts;
    },
    {} as Record<WishlistTab, number>
  );
}

export function getActiveWishlistFilterChips(query: WishlistQueryState) {
  const chips: Array<{ key: keyof WishlistQueryState; label: string }> = [];
  if (query.status) {
    chips.push({
      key: "status",
      label:
        query.status === "available"
          ? "구매 가능"
          : query.status === "soldout"
            ? "품절"
            : "판매 완료",
    });
  }
  if (query.kind) {
    chips.push({ key: "kind", label: query.kind === "new" ? "새상품" : "중고명품" });
  }
  if (query.grade) chips.push({ key: "grade", label: `${query.grade}급` });
  if (query.category) {
    chips.push({ key: "category", label: WISHLIST_TAB_LABELS[query.category] });
  }
  if (query.brand) chips.push({ key: "brand", label: query.brand });
  if (query.price) {
    chips.push({
      key: "price",
      label:
        query.price === "under-200"
          ? "200만원 이하"
          : query.price === "200-500"
            ? "200-500만원"
            : "500만원 이상",
    });
  }
  if (query.delivery) chips.push({ key: "delivery", label: query.delivery });
  if (query.priceDrop) chips.push({ key: "priceDrop", label: "가격 인하 상품" });
  return chips;
}

export function getSimilarProducts(product: Product, catalog: Product[], limit = 8) {
  const kind = getProductKind(product);
  const scored = catalog
    .filter((item) => item.id !== product.id)
    .map((item) => {
      let score = 0;
      if (item.brand === product.brand) score += 3;
      if (getProductKind(item) === kind) score += 2;
      if (item.isPreOwned === product.isPreOwned) score += 1;
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.item);
}
