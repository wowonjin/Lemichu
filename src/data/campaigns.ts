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

export type HeroSlideCard = {
  brand: string;
  name: string;
  badge: string;
  priceLabel: string;
  seed: string;
};

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  tone: string;
  dark?: boolean;
  cards: HeroSlideCard[];
};

export const heroSlides: HeroSlide[] = [
  {
    id: "s1",
    eyebrow: "This Month's Top Brand",
    title: "이달의 주목할 브랜드",
    subtitle: "지금 가장 사랑받는 명품을 검수 완료 상태로 만나보세요.",
    ctaLabel: "지금 쇼핑하기",
    ctaHref: "/new-arrivals",
    tone: "linear-gradient(120deg, #efe9df 0%, #ddd0bb 55%, #c9b794 100%)",
    cards: [
      { brand: "HERMÈS", name: "켈리 25 세사미", badge: "희소상품", priceLabel: "₩28,400,000", seed: "slide-hermes" },
      { brand: "CHANEL", name: "클래식 미디움", badge: "검수완료", priceLabel: "₩9,480,000", seed: "slide-chanel" },
      { brand: "ROLEX", name: "데이저스트 36", badge: "검수완료", priceLabel: "₩14,200,000", seed: "slide-rolex" },
      { brand: "DIOR", name: "레이디 디올", badge: "검수완료", priceLabel: "₩5,640,000", seed: "slide-dior" },
    ],
  },
  {
    id: "s2",
    eyebrow: "Verified Pre-Owned",
    title: "검수 완료 중고명품",
    subtitle: "전문 검수팀이 정품과 상태 등급까지 확인한 세컨핸드.",
    ctaLabel: "중고명품 보기",
    ctaHref: "/pre-owned",
    tone: "linear-gradient(120deg, #ece8e3 0%, #cfc7bd 55%, #a89c8c 100%)",
    cards: [
      { brand: "CHANEL", name: "보이백 올드미디움", badge: "S급", priceLabel: "₩6,350,000", seed: "slide-boy" },
      { brand: "HERMÈS", name: "피코탄 18 PM", badge: "A급", priceLabel: "₩3,240,000", seed: "slide-pico" },
      { brand: "CELINE", name: "트리오페 미디움", badge: "S급", priceLabel: "₩2,980,000", seed: "slide-triomphe" },
      { brand: "GUCCI", name: "디오니소스 스몰", badge: "가격하락", priceLabel: "₩1,280,000", seed: "slide-dionysus" },
    ],
  },
  {
    id: "s3",
    eyebrow: "Ready to Ship",
    title: "지금 바로 배송 가능",
    subtitle: "오늘 주문하면 오늘 출고. 빠르게 받아보세요.",
    ctaLabel: "오늘출고 상품",
    ctaHref: "/new-arrivals",
    tone: "linear-gradient(120deg, #e9e6e2 0%, #d3cabb 55%, #b39e7d 100%)",
    cards: [
      { brand: "SAINT LAURENT", name: "루루 스몰", badge: "오늘출고", priceLabel: "₩2,340,000", seed: "slide-lou" },
      { brand: "LOEWE", name: "퍼즐 스몰", badge: "오늘출고", priceLabel: "₩2,680,000", seed: "slide-puzzle" },
      { brand: "PRADA", name: "갈레리아 라지", badge: "오늘출고", priceLabel: "₩3,010,000", seed: "slide-galleria" },
      { brand: "CARTIER", name: "러브 브레이슬릿", badge: "오늘출고", priceLabel: "₩9,900,000", seed: "slide-love" },
    ],
  },
  {
    id: "s4",
    eyebrow: "Sell & Trade",
    title: "집에 잠든 명품, 시세 확인",
    subtitle: "사진만 올리면 예상 판매가를 안내해드립니다.",
    ctaLabel: "내 명품 시세 확인하기",
    ctaHref: "/sell",
    tone: "linear-gradient(120deg, #1c1c1c 0%, #262422 55%, #3a352c 100%)",
    dark: true,
    cards: [
      { brand: "LOUIS VUITTON", name: "온더고 MM", badge: "위탁가능", priceLabel: "예상 ₩2.8M", seed: "slide-otg" },
      { brand: "CHANEL", name: "클래식 WOC", badge: "위탁가능", priceLabel: "예상 ₩3.1M", seed: "slide-woc" },
      { brand: "BOTTEGA VENETA", name: "카세트백", badge: "위탁가능", priceLabel: "예상 ₩2.4M", seed: "slide-cassette" },
      { brand: "PRADA", name: "리나일론 호보", badge: "위탁가능", priceLabel: "예상 ₩1.1M", seed: "slide-hobo" },
    ],
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
