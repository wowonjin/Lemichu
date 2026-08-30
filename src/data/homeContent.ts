import type { ProductKind } from "@/lib/productKind";

export const homeBenefitItems = [
  { id: "auth", title: "정품 검수", description: "출고 전 전문 검수" },
  { id: "duty", title: "관부가세 포함", description: "추가 비용 없음" },
  { id: "delivery", title: "배송 예정일 안내", description: "주문 전 일정 확인" },
  { id: "guarantee", title: "가품 200% 보상", description: "공인 판정 시 지급" },
] as const;

export type AudiencePickId = "first-luxury" | "office" | "gift" | "classic";

export const audiencePicks: {
  id: AudiencePickId;
  label: string;
  shortLabel: string;
  audience: string;
  hint: string;
  kinds: ProductKind[];
  maxPrice?: number;
  minPrice?: number;
  preferPreOwned?: boolean;
}[] = [
  {
    id: "first-luxury",
    label: "첫 명품",
    shortLabel: "첫 명품",
    audience: "처음 사기 좋은 아이템",
    hint: "처음 사기 좋은 아이템",
    kinds: ["wallet", "jewelry", "women-bag"],
    maxPrice: 3200000,
  },
  {
    id: "office",
    label: "출근용",
    shortLabel: "출근용",
    audience: "매일 들기 좋은 데일리 명품",
    hint: "매일 들기 좋은 데일리 명품",
    kinds: ["women-bag", "men-bag", "wallet", "watch"],
  },
  {
    id: "gift",
    label: "선물",
    shortLabel: "선물",
    audience: "센스 있는 50~150만원대",
    hint: "센스 있는 50~150만원대",
    kinds: ["wallet", "jewelry", "shoes"],
    minPrice: 500000,
    maxPrice: 1500000,
  },
  {
    id: "classic",
    label: "클래식",
    shortLabel: "클래식",
    audience: "오래 소장할 스테디셀러",
    hint: "오래 소장할 스테디셀러",
    kinds: ["women-bag", "watch", "jewelry"],
    minPrice: 1800000,
  },
];

export type PriceBandId = "under-200" | "under-500" | "under-1000" | "from-1500";

export const priceBands: {
  id: PriceBandId;
  label: string;
  shortLabel: string;
  rangeLabel: string;
  hint: string;
  minPrice?: number;
  maxPrice?: number;
  preOwnedOnly?: boolean;
}[] = [
  {
    id: "under-200",
    label: "20만원 이하",
    shortLabel: "20만원 이하",
    rangeLabel: "20만원 이하",
    hint: "부담 없이 시작하기 좋은 명품",
    maxPrice: 200000,
  },
  {
    id: "under-500",
    label: "50만원 이하",
    shortLabel: "50만원 이하",
    rangeLabel: "50만원 이하",
    hint: "입문으로 많이 고르는 구간",
    maxPrice: 500000,
  },
  {
    id: "under-1000",
    label: "100만원 이하",
    shortLabel: "100만원 이하",
    rangeLabel: "100만원 이하",
    hint: "데일리로 쓰기 좋은 라인",
    maxPrice: 1000000,
  },
  {
    id: "from-1500",
    label: "150만원 이상",
    shortLabel: "150만원 이상",
    rangeLabel: "150만원 이상",
    hint: "소장 가치를 보기 시작하는 구간",
    minPrice: 1500000,
  },
];

export type TrendRelation = "worn" | "same-brand" | "inspired";

export const trendRelationLabel: Record<TrendRelation, string> = {
  worn: "셀럽 착용 제품",
  "same-brand": "동일 브랜드 유사 제품",
  inspired: "스타일에서 영감을 받은 제품",
};

export const trendRelationShortLabel: Record<TrendRelation, string> = {
  worn: "착용",
  "same-brand": "같은 브랜드",
  inspired: "스타일 영감",
};

export const trendStories: {
  id: string;
  title: string;
  shortLabel: string;
  editorialLabel: string;
  excerpt: string;
  relation: TrendRelation;
  href: string;
  match: string[];
}[] = [
  {
    id: "classic-feed",
    title: "다시 돌아온 클래식 백",
    shortLabel: "클래식 백",
    editorialLabel: "CLASSIC",
    excerpt: "시즌이 바뀌어도 다시 찾게 되는 미니멀 플랩과 체인백.",
    relation: "inspired",
    href: "/magazine/style-curation",
    match: ["플랩", "체인", "클래식", "보이백"],
  },
  {
    id: "office-edit",
    title: "출근룩을 완성하는 아이템",
    shortLabel: "출근룩",
    editorialLabel: "EDIT",
    excerpt: "토트와 지갑, 시계로 과하지 않게 마무리하는 오피스 에디트.",
    relation: "same-brand",
    href: "/magazine/hermes-guide",
    match: ["토트", "지갑", "워치", "시계"],
  },
  {
    id: "gift-edit",
    title: "센스 있는 명품 선물",
    shortLabel: "선물",
    editorialLabel: "GIFT",
    excerpt: "고르기 쉬운 주얼리와 스몰 레더 굿즈를 골랐어요.",
    relation: "inspired",
    href: "/magazine/pre-owned-guide",
    match: ["주얼리", "지갑", "링", "브레이슬릿"],
  },
];

export const inspectionEvidence = [
  {
    id: "serial",
    title: "정품 디테일",
    description: "로고·각인·시리얼 확인",
    imageUrl: "/inspection/inspect-serial.webp",
    imageAlt: "로고와 시리얼 각인을 확대해 확인한 검수 사진",
  },
  {
    id: "finish",
    title: "소재와 마감",
    description: "봉제·금속·스티치 확인",
    imageUrl: "/inspection/inspect-finish.webp",
    imageAlt: "가죽 스티치와 금속 마감을 확대해 확인한 검수 사진",
  },
  {
    id: "package",
    title: "구성품",
    description: "박스·더스트백·보증서 확인",
    imageUrl: "/inspection/inspect-package.webp",
    imageAlt: "박스, 더스트백, 보증서를 펼쳐 확인한 검수 사진",
  },
  {
    id: "condition",
    title: "컨디션",
    description: "스크래치·오염·사용감 확인",
    imageUrl: "/inspection/inspect-condition.webp",
    imageAlt: "코너 스크래치와 사용감을 확대해 확인한 검수 사진",
  },
] as const;

export type HomePurchaseReview = {
  id: string;
  brand: string;
  name: string;
  imageUrl: string;
  href: string;
  rating: number;
  verified: boolean;
  body: string;
};

export const homePurchaseReviews: HomePurchaseReview[] = [];

export const homeFaqItems = [
  {
    q: "정품 검수는 어떻게 진행되나요?",
    a: "레미츄는 카테고리별 전문 검수팀이 모든 상품의 정품 여부를 직접 확인합니다. 출고 전 검수를 거친 상품만 판매하며, 가품은 취급하지 않습니다.",
  },
  {
    q: "가품으로 판정되면 어떻게 되나요?",
    a: "공인된 감정 기관을 통해 가품으로 판정될 경우 결제 금액의 200%를 보상합니다. 보상은 가품 판정 리포트 확인 후 영업일 기준 3일 이내에 처리됩니다.",
  },
  {
    q: "교환·반품은 언제 가능한가요?",
    a: "구매대행 방식 특성상 단순 변심에 의한 취소·반품은 어렵습니다. 상품 하자, 오배송 또는 판매자 과실이 있는 경우 수령 후 1-2일 내 고객센터로 문의해 주시면 교환 또는 환불을 진행합니다.",
  },
];
