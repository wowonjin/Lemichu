export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
  productName?: string;
  verified?: boolean;
};

export const defaultProductReviews: ProductReview[] = [
  {
    id: "rv-1",
    author: "j****n",
    rating: 5,
    date: "2026.06.18",
    body: "검수 리포트까지 함께 와서 믿고 살 수 있었어요. 상태도 설명 그대로였습니다.",
    productName: "샤넬 클래식 미디움 플랩백",
    verified: true,
  },
  {
    id: "rv-2",
    author: "s****2",
    rating: 5,
    date: "2026.06.11",
    body: "포장이 꼼꼼하고 배송도 안내받은 기간 안에 도착했어요. 만족합니다.",
    productName: "루이비통 온더고 MM",
    verified: true,
  },
  {
    id: "rv-3",
    author: "m****e",
    rating: 5,
    date: "2026.06.03",
    body: "구성품 사진과 실물이 같아서 안심이 됐습니다. 다음에도 여기서 살 것 같아요.",
    productName: "에르메스 가든파티 36",
    verified: true,
  },
  {
    id: "rv-4",
    author: "k****7",
    rating: 5,
    date: "2026.05.27",
    body: "하드웨어 스크래치가 리포트에 적힌 그대로여서, 받는 순간 따로 확인할 필요가 없었어요.",
    productName: "롤렉스 데이트저스트 31mm",
    verified: true,
  },
  {
    id: "rv-5",
    author: "y****a",
    rating: 4,
    date: "2026.05.19",
    body: "배송이 하루 늦었지만 포장과 상품 상태는 만족스러웠습니다.",
    productName: "까르띠에 러브 브레이슬릿",
    verified: true,
  },
];

export function getReviewSummary(reviews: ProductReview[] = defaultProductReviews) {
  const count = reviews.length;
  const average =
    count === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / count;

  return {
    count,
    average,
    averageLabel: average.toFixed(1),
  };
}
