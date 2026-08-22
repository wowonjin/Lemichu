import {
  Trophy,
  Sparkles,
  Tag,
  RotateCcw,
  Crown,
  HandCoins,
  ShieldCheck,
  ShieldAlert,
  Truck,
  Gem,
  CreditCard,
  Camera,
  LineChart,
  PackageCheck,
  BadgeCheck,
  FileCheck2,
  Boxes,
  ScanSearch,
  type LucideIcon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Quick actions (6 shortcut cards)                                           */
/* -------------------------------------------------------------------------- */

export type QuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export const quickActions: QuickAction[] = [
  { id: "ranking", label: "랭킹", description: "지금 가장 인기", href: "/ranking", icon: Trophy },
  { id: "new", label: "신규입고", description: "방금 들어온 명품", href: "/new-arrivals", icon: Sparkles },
  { id: "promotions", label: "기획전", description: "이번 주 큐레이션", href: "/promotions", icon: Tag },
  { id: "pre-owned", label: "중고명품", description: "검수 완료 중고", href: "/pre-owned", icon: RotateCcw },
  { id: "brand", label: "브랜드", description: "브랜드별 모아보기", href: "/brand", icon: Crown },
  { id: "sell", label: "판매하기", description: "내 명품 시세 확인", href: "/sell", icon: HandCoins },
];

/* -------------------------------------------------------------------------- */
/* Trust strip                                                                */
/* -------------------------------------------------------------------------- */

export type TrustItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const trustItems: TrustItem[] = [
  { id: "auth", title: "정품 검수", description: "전문 검수팀 1:1 확인", icon: ShieldCheck },
  { id: "guarantee", title: "가품 보상", description: "가품 판정 시 200% 보상", icon: ShieldAlert },
  { id: "delivery", title: "빠른 배송", description: "오늘출고 당일 발송", icon: Truck },
  { id: "care", title: "프리미엄 케어", description: "클리닝·복원 케어 연계", icon: Gem },
  { id: "payment", title: "안전 결제", description: "에스크로 안심 결제", icon: CreditCard },
];

/* -------------------------------------------------------------------------- */
/* Hero floating cards                                                         */
/* -------------------------------------------------------------------------- */

export type HeroCard = {
  id: string;
  brand: string;
  name: string;
  badge: string;
  priceLabel: string;
  seed: string;
};

export const heroCards: HeroCard[] = [
  { id: "h1", brand: "HERMÈS", name: "켈리 25 세사미", badge: "검수완료", priceLabel: "₩28,400,000", seed: "hermes-kelly" },
  { id: "h2", brand: "CHANEL", name: "클래식 미디움 캐비어", badge: "오늘출고", priceLabel: "₩9,480,000", seed: "chanel-classic" },
  { id: "h3", brand: "ROLEX", name: "데이저스트 36", badge: "희소상품", priceLabel: "₩14,200,000", seed: "rolex-datejust" },
];

/* -------------------------------------------------------------------------- */
/* Hero carousel slides (auto-rotating)                                        */
/* -------------------------------------------------------------------------- */

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  dark?: boolean;
};

export const heroSlides: HeroSlide[] = [
  {
    id: "s1",
    eyebrow: "This Week’s Arrival",
    title: "이번 주 검수 완료",
    subtitle: "신상부터 클래식까지, 출고 전 검수를 마친 명품만 올렸습니다.",
    ctaLabel: "신상품 보기",
    ctaHref: "/new-arrivals",
    image: "/hero/hero-new-v2.jpg",
  },
  {
    id: "s2",
    eyebrow: "Verified Pre-Owned",
    title: "중고명품, 등급까지 공개",
    subtitle: "S/A/B 등급과 검수 리포트를 먼저 보고 고르세요.",
    ctaLabel: "중고명품 보기",
    ctaHref: "/pre-owned",
    image: "/hero/hero-preowned-v2.jpg",
  },
  {
    id: "s3",
    eyebrow: "Ready to Ship",
    title: "오늘 결제하면 오늘 출고",
    subtitle: "국내 재고는 검수 후 바로 발송됩니다. 배송 가능일을 먼저 확인하세요.",
    ctaLabel: "오늘출고 상품",
    ctaHref: "/new-arrivals",
    image: "/hero/hero-ship-v2.jpg",
  },
  {
    id: "s4",
    eyebrow: "Midnight Sale",
    title: "오늘 자정까지 타임세일",
    subtitle: "한정 수량으로 열린 검수 완료 특가입니다.",
    ctaLabel: "세일 보러가기",
    ctaHref: "/sale",
    image: "/hero/hero-sale-v2.jpg",
    dark: true,
  },
  {
    id: "s5",
    eyebrow: "Sell & Consign",
    title: "집에 잠든 명품, 시세부터",
    subtitle: "사진만 올리면 예상 판매가를 안내해 드립니다.",
    ctaLabel: "시세 확인하기",
    ctaHref: "/sell",
    image: "/hero/hero-sell-v2.jpg",
  },
  {
    id: "s6",
    eyebrow: "Watches & Jewelry",
    title: "시계와 주얼리",
    subtitle: "케이스 사이즈와 구성품까지 확인하고 구매하세요.",
    ctaLabel: "시계·주얼리 보기",
    ctaHref: "/category/watches",
    image: "/hero/hero-watch-v2.jpg",
    dark: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Sell process steps                                                          */
/* -------------------------------------------------------------------------- */

export type SellStep = {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const sellSteps: SellStep[] = [
  { step: 1, title: "사진 업로드", description: "상품 사진만 올리면 접수 완료", icon: Camera },
  { step: 2, title: "예상 시세 확인", description: "실거래 기반 예상 판매가 안내", icon: LineChart },
  { step: 3, title: "무료 수거 / 방문 접수", description: "원하는 방식으로 안전하게 전달", icon: Truck },
  { step: 4, title: "검수 후 판매 / 정산", description: "정품 검수 통과 시 빠른 정산", icon: PackageCheck },
];

/* -------------------------------------------------------------------------- */
/* Authentication guide                                                        */
/* -------------------------------------------------------------------------- */

export type AuthStep = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const authSteps: AuthStep[] = [
  { id: "expert", title: "전문 검수", description: "카테고리별 전문 검수팀이 정품 여부를 직접 확인합니다.", icon: ScanSearch },
  { id: "grade", title: "상품 상태 등급화", description: "외관·사용감을 기준으로 S/A/B 등급을 투명하게 부여합니다.", icon: BadgeCheck },
  { id: "serial", title: "시리얼 / 구성품 확인", description: "시리얼 넘버와 정품 구성품을 대조해 진위를 검증합니다.", icon: Boxes },
  { id: "report", title: "검수 리포트 제공", description: "검수 항목과 결과를 리포트로 투명하게 공개합니다.", icon: FileCheck2 },
  { id: "policy", title: "보상 정책 안내", description: "가품 판정 시 200% 보상으로 안심하고 구매하세요.", icon: ShieldCheck },
];

/* -------------------------------------------------------------------------- */
/* Magazine                                                                    */
/* -------------------------------------------------------------------------- */

export type MagazineItem = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  href: string;
  seed: string;
};

export const magazineItems: MagazineItem[] = [
  {
    id: "m1",
    category: "브랜드 가이드",
    title: "에르메스 백, 처음이라면 알아야 할 5가지",
    excerpt: "레더 종류부터 하드웨어, 시즌 컬러까지 핵심만 정리했습니다.",
    href: "/magazine/hermes-guide",
    seed: "mag-hermes",
  },
  {
    id: "m2",
    category: "중고명품 구매 가이드",
    title: "중고 명품, 상태 등급 제대로 읽는 법",
    excerpt: "S급과 A급의 실제 차이, 가격과 컨디션의 균형점을 짚어봅니다.",
    href: "/magazine/pre-owned-guide",
    seed: "mag-preowned",
  },
  {
    id: "m3",
    category: "가격 시세 리포트",
    title: "2026 상반기 인기 모델 시세 흐름",
    excerpt: "클래식 라인의 리세일 가치와 가격 변동 데이터를 분석했습니다.",
    href: "/magazine/price-report",
    seed: "mag-price",
  },
  {
    id: "m4",
    category: "스타일 큐레이션",
    title: "데일리로 드는 미니멀 명품 코디",
    excerpt: "톤온톤으로 완성하는 절제된 럭셔리 스타일링 제안.",
    href: "/magazine/style-curation",
    seed: "mag-style",
  },
];
