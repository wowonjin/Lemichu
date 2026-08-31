export type PurchaseReview = {
  id: string;
  productName: string;
  productHref: string;
  imageSrc: string;
  author: string;
  date: string;
  rating: 5;
  body: string;
  source: string;
};

export const purchaseReviews: PurchaseReview[] = [
  {
    id: "review-margiela-woc",
    productName: "메종 마르지엘라 WOC 체인백",
    productHref: "/product/bunjang-423167746",
    imageSrc: "/review-images/margiela-woc.png",
    author: "김****",
    date: "2026.08.22",
    rating: 5,
    body: "제품 상태가 안내받은 내용과 같았고 포장도 꼼꼼했어요. 풀세트 구성이라 더 만족스럽고, 블랙 컬러라 여러 옷에 편하게 매치하기 좋습니다.",
    source: "번개장터 구매 후기",
  },
  {
    id: "review-dior-card",
    productName: "디올 레이디 디올 까나쥬 카드지갑",
    productHref: "/product/bunjang-394636723",
    imageSrc: "https://media.bunjang.co.kr/product/394636723_1_1773734328_w900.jpg",
    author: "이****",
    date: "2026.08.18",
    rating: 5,
    body: "사진으로 확인한 것보다 실물이 더 깔끔했어요. 카드 수납도 편하고 디자인이 고급스러워서 데일리로 잘 사용하고 있습니다.",
    source: "번개장터 구매 후기",
  },
  {
    id: "review-prada-clutch",
    productName: "프라다 사피아노 클러치",
    productHref: "/product/bunjang-421096548",
    imageSrc: "https://media.bunjang.co.kr/product/421096548_1_1787049003_w900.jpg",
    author: "박****",
    date: "2026.08.12",
    rating: 5,
    body: "전체적인 상태가 깔끔하고 구성품도 잘 갖춰져 있어 만족했어요. 심플한 디자인이라 유행을 타지 않고 오래 사용할 수 있을 것 같습니다.",
    source: "번개장터 구매 후기",
  },
];
