import type { HomeSectionId } from "@/lib/home-sections";
import type { AlgorithmDoc } from "@/lib/home-algorithms";

export type HomeSectionMeta = {
  id: HomeSectionId;
  title: string;
  homeTitle: string;
  description: string;
  algorithm: AlgorithmDoc;
  slots: Array<{
    key: string;
    label: string;
    hint: string;
    limit: number;
    visibleOnHome: number;
  }>;
};

export const homeSectionMeta: HomeSectionMeta[] = [
  {
    id: "time-sale",
    title: "오늘의 타임세일",
    homeTitle: "오늘의 타임세일",
    description: "할인율·재고 희소성·관심도를 곱한 딜 스코어로 오늘 자정까지 노출할 상품을 고릅니다.",
    algorithm: {
      id: "discount-urgency",
      name: "할인-희소성 딜 스코어 (DUS)",
      inspiredBy: ["쿠팡 와우딜", "G마켓 슈퍼딜", "11번가 타임딜"],
      summary:
        "패션/오픈마켓 타임딜은 할인만으로 정렬하지 않습니다. 할인 포화함수에 재고 희소성과 관심 로그를 곱해, 마감 임박·재고 적은 딜이 위로 올라오게 합니다.",
      formula: [
        "S = d̂ · (1 + 0.25 ln(1+W)) · (1 + 0.35 σ) · (1 + 0.20 P)",
        "d̂ = d / (d + 0.18),   d = 할인율",
        "σ = 1 / (1 + 재고수량)",
        "P = 행동 인기도 (조회·찜·판매 로그합의 포화값)",
      ].join("\n"),
      variables: [
        { symbol: "d", meaning: "할인율 (0~1). 정가 대비 판매가 하락분" },
        { symbol: "d̂", meaning: "Michaelis–Menten 포화. 18%에서 절반, 과한 할인 폭주를 막음" },
        { symbol: "W", meaning: "찜 수" },
        { symbol: "σ", meaning: "재고 희소성. 재고가 적을수록 1에 가까움" },
        { symbol: "P", meaning: "조회/찜/판매 기반 인기도" },
      ],
    },
    slots: [{ key: "today", label: "오늘 딜", hint: "할인 상품만 후보", limit: 8, visibleOnHome: 6 }],
  },
  {
    id: "ranking",
    title: "지금 많이 보고 있어요",
    homeTitle: "지금 많이 보고 있어요",
    description:
      "조회·찜·판매를 시간 감쇠와 베이지안 수축으로 합친 실시간 랭킹입니다. 신규 상품은 콘텐츠 점수로 콜드스타트를 보완합니다.",
    algorithm: {
      id: "bayesian-wilson-rank",
      name: "베이지안 수축 + Wilson 실시간 랭킹",
      inspiredBy: ["무신사 실시간 랭킹", "지그재그 트렌딩", "29CM 지금 많이 보는", "Reddit Best / Amazon 리뷰 랭킹"],
      summary:
        "조회 1회로 1위가 되는 것을 막기 위해 관측 수 n이 작을수록 콘텐츠 점수 C로 수축합니다(Empirical Bayes). 행동 점수는 로그 인기도에 Wilson 하한을 섞어, 표본이 적은 전환율을 보수적으로 봅니다.",
      formula: [
        "S = λC + (1 − λ)B",
        "λ = m / (m + n),   m = 8,   n = V + W + Q",
        "C = 0.35 d̂ + 0.30 r + 0.20 a + 0.15 c",
        "r = 0.5^(age / 21)",
        "B = 0.70 P + 0.30 ω",
        "P = sat(0.45 ln(1+V) + 0.25 ln(1+W) + 0.20 ln(1+Q) + 0.10 r)",
        "ω = Wilson lower bound(성공=W+Q, 시행=V+W+Q, z=1.96)",
      ].join("\n"),
      variables: [
        { symbol: "λ", meaning: "콜드스타트 가중. 데이터가 없을수록 1에 가까워 콘텐츠 점수를 따름" },
        { symbol: "V, W, Q", meaning: "조회 수, 찜 수, 결제완료 판매 수량" },
        { symbol: "C", meaning: "할인·신선도·재고·컨디션으로 만든 콘텐츠 점수" },
        { symbol: "r", meaning: "등록일 기준 반감기 21일의 지수 감쇠" },
        { symbol: "ω", meaning: "Wilson score 하한. 적은 표본의 전환율을 과대평가하지 않음" },
        { symbol: "B", meaning: "행동 점수. 인기도 P와 Wilson ω의 가중합" },
      ],
    },
    slots: [
      { key: "all", label: "전체", hint: "스토어 전체 인기", limit: 24, visibleOnHome: 4 },
      { key: "pre-owned", label: "중고", hint: "중고 상품만", limit: 24, visibleOnHome: 4 },
    ],
  },
  {
    id: "audience",
    title: "지금 누구를 위한 명품을 찾고 계세요?",
    homeTitle: "지금 누구를 위한 명품을 찾고 계세요?",
    description:
      "상황(첫 명품/출근/선물/클래식)별로 카테고리·가격 제약을 건 뒤, 적합도 점수와 브랜드 다양성(MMR)으로 4개를 고릅니다.",
    algorithm: {
      id: "occasion-mmr",
      name: "상황 적합도 + MMR 다양성",
      inspiredBy: ["29CM 상황별 큐레이션", "W Concept Edit", "SSENSE Shop by", "Netflix/Spotify MMR"],
      summary:
        "후보를 상황 규칙으로 필터한 다음 랭킹 점수에 상황 보너스를 더합니다. 최종 4개는 Maximal Marginal Relevance로 같은 브랜드가 한 탭을 독점하지 않게 합니다.",
      formula: [
        "후보: kind ∈ K_tab  ∧  p_min ≤ price ≤ p_max",
        "rel(i) = normalize(S_rank(i) + bonus_tab(i))",
        "MMR(i) = λ rel(i) − (1 − λ) max_{j∈선택된} sim(i,j)",
        "λ = 0.72",
        "sim = 1 (동일 브랜드),  0.4 (동일 카테고리),  0 (그 외)",
      ].join("\n"),
      variables: [
        { symbol: "K_tab", meaning: "탭별 허용 카테고리. 예: 첫 명품 = 지갑·주얼리·여성백" },
        { symbol: "S_rank", meaning: "실시간 랭킹과 같은 베이지안 점수" },
        { symbol: "bonus_tab", meaning: "탭 목적 가산. 선물은 스몰 굿즈, 클래식은 고가·상위 컨디션" },
        { symbol: "MMR", meaning: "관련도와 이미 고른 상품과의 최대 유사도를 빼 다양성을 확보" },
      ],
    },
    slots: [
      { key: "first-luxury", label: "첫 명품", hint: "320만원 이하 입문 아이템", limit: 8, visibleOnHome: 4 },
      { key: "office", label: "출근용", hint: "데일리 백·지갑·시계", limit: 8, visibleOnHome: 4 },
      { key: "gift", label: "선물", hint: "50~150만원 스몰 굿즈", limit: 8, visibleOnHome: 4 },
      { key: "classic", label: "클래식", hint: "180만원 이상 스테디셀러", limit: 8, visibleOnHome: 4 },
    ],
  },
  {
    id: "price-band",
    title: "예산만 정하면, 명품은 골라드릴게요",
    homeTitle: "예산만 정하면, 명품은 골라드릴게요",
    description: "가격대 안에서 인기·가성비·구간 중앙 근접도를 섞고, 브랜드 MMR로 대표 상품 4개를 고릅니다.",
    algorithm: {
      id: "price-band-mmr",
      name: "가격대 대표 선정 + 브랜드 MMR",
      inspiredBy: ["크림 가격대 필터", "머스트잇", "무신사 가격 밴드", "Amazon representative SKU"],
      summary:
        "같은 가격대에서 가장 싼 4개만 보여주면 퀄리티가 떨어집니다. 인기 점수와 할인, 구간 중앙에 가까운 대표 가격을 섞은 뒤 브랜드가 겹치지 않게 뽑습니다.",
      formula: [
        "후보: p_min ≤ price ≤ p_max",
        "U(i) = 0.40 S_rank + 0.35 center(i) + 0.25 d̂",
        "center(i) = 1 − |price − μ| / (p_max − p_min)",
        "이후 audience와 동일한 MMR(λ=0.72, 브랜드/카테고리 유사도)",
      ].join("\n"),
      variables: [
        { symbol: "μ", meaning: "해당 가격대 구간의 중앙값" },
        { symbol: "center", meaning: "너무 싸거나 구간 끝으로 치우친 상품을 살짝 낮춤" },
        { symbol: "U", meaning: "가격대 안에서의 대표성 점수" },
      ],
    },
    slots: [
      { key: "under-200", label: "20만원 이하", hint: "입문 가격대", limit: 8, visibleOnHome: 4 },
      { key: "under-500", label: "50만원 이하", hint: "입문 가격대", limit: 8, visibleOnHome: 4 },
      { key: "under-1000", label: "100만원 이하", hint: "데일리 라인", limit: 8, visibleOnHome: 4 },
      { key: "from-1500", label: "150만원 이상", hint: "소장 가치", limit: 8, visibleOnHome: 4 },
    ],
  },
  {
    id: "trend",
    title: "요즘 자주 보이는 명품만 모았어요",
    homeTitle: "요즘 자주 보이는 명품만 모았어요",
    description: "에디토리얼 키워드 일치율에 신선도와 인기도를 더해 이번 주 스토리별 상품을 고릅니다.",
    algorithm: {
      id: "editorial-tf-recency",
      name: "에디토리얼 TF + 신선도 + 인기",
      inspiredBy: ["29CM 매거진", "W Concept Weekly", "무신사 스냅/트렌드"],
      summary:
        "매거진형 커머스는 키워드 매칭만으로 끝내지 않습니다. 스토리 키워드 일치율(단순 TF)에 등록 신선도와 랭킹 점수를 더해, 요즘 들어온 트렌드 피스가 위로 오게 합니다.",
      formula: [
        "tf = (일치 키워드 수) / |키워드|",
        "T = 0.50 tf + 0.30 r_trend + 0.20 S_rank",
        "r_trend = 0.5^(age / 14)",
      ].join("\n"),
      variables: [
        { symbol: "tf", meaning: "상품명·브랜드에 스토리 키워드가 들어간 비율" },
        { symbol: "r_trend", meaning: "반감기 14일의 신선도. 트렌드 섹션은 랭킹보다 더 빨리 감쇠" },
        { symbol: "S_rank", meaning: "실시간 랭킹 점수. 키워드만 맞고 관심 없는 상품을 낮춤" },
      ],
    },
    slots: [
      { key: "classic-feed", label: "다시 돌아온 클래식 백", hint: "플랩·체인·클래식", limit: 6, visibleOnHome: 4 },
      { key: "office-edit", label: "출근룩을 완성하는 아이템", hint: "토트·지갑·시계", limit: 6, visibleOnHome: 4 },
      { key: "gift-edit", label: "센스 있는 명품 선물", hint: "주얼리·지갑", limit: 6, visibleOnHome: 4 },
    ],
  },
];

export function getHomeSectionMeta(id: HomeSectionId) {
  return homeSectionMeta.find((section) => section.id === id);
}
