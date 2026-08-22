import type { Product } from "@/types/product";

export type ProductKind =
  | "women-bag"
  | "men-bag"
  | "wallet"
  | "shoes"
  | "watch"
  | "jewelry"
  | "apparel"
  | "other";

const kindKeywords: Record<Exclude<ProductKind, "other">, string[]> = {
  watch: ["워치", "시계", "데이저스트", "오이스터", "롤렉스", "서브마리너", "탱크"],
  jewelry: ["브레이슬릿", "목걸이", "반지", "링", "주얼리", "다이아", "앵끌루", "코코 크러쉬"],
  shoes: ["스니커", "로퍼", "샌들", "부츠", "슈즈", "힐", "펌프스", "플랫", "발레리나"],
  wallet: ["월릿", "월렛", "지갑", "woc", "카드"],
  "men-bag": ["서류", "백팩", "메신저", "브리프", "비즈니스"],
  "women-bag": ["백", "토트", "숄더", "클러치", "호보", "체인", "플랩", "가방", "피코탄", "켈리", "가든파티"],
  apparel: ["자켓", "코트", "니트", "셔츠", "원피스", "티셔츠", "가디건", "패딩"],
};

export function productHaystack(product: Pick<Product, "brand" | "name" | "color" | "size" | "badges">): string {
  return `${product.brand} ${product.name} ${product.color ?? ""} ${product.size ?? ""} ${product.badges.join(" ")}`.toLowerCase();
}

export function getProductKind(product: Product): ProductKind {
  const hay = productHaystack(product);

  for (const kind of ["watch", "jewelry", "shoes", "wallet", "men-bag", "apparel", "women-bag"] as const) {
    if (kindKeywords[kind].some((keyword) => hay.includes(keyword.toLowerCase()))) {
      return kind;
    }
  }

  return "other";
}

export function productMatchesKind(product: Product, kind: ProductKind): boolean {
  return getProductKind(product) === kind;
}

export function productMatchesAnyKind(product: Product, kinds: ProductKind[]): boolean {
  return kinds.includes(getProductKind(product));
}
