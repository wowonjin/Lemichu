import type { InfoDoc } from "@/data/pageContent";

export type EventPost = {
  slug: string;
  title: string;
  desc: string;
  period: string;
  badge: string;
  image: string;
  doc: InfoDoc;
};

export const eventPosts: EventPost[] = [
  {
    slug: "summer-special-week",
    title: "여름 특가 위크",
    desc: "시즌 인기 모델 한정 특가",
    period: "2026.07.01 - 2026.07.14",
    badge: "한정 특가",
    image: "/events/event-summer-week.png",
    doc: {
      title: "여름 특가 위크",
      description:
        "여름 시즌에 가장 많이 찾는 인기 명품을 레미츄 단독 특가로 만나보세요.",
      updatedAt: "2026.06.30",
      sections: [
        {
          heading: "이벤트 혜택",
          paragraphs: [
            "행사 기간 동안 선정된 시즌 인기 상품을 특별 할인가로 제공합니다.",
            "가방, 지갑, 주얼리 등 데일리로 활용하기 좋은 카테고리를 중심으로 큐레이션했습니다.",
          ],
          bullets: [
            "시즌 인기 모델 최대 18% 특가",
            "정품 검수 완료 상품 우선 노출",
            "일부 상품 오늘출고 가능",
          ],
        },
        {
          heading: "참여 방법",
          paragraphs: [
            "이벤트 페이지에서 특가 상품을 확인한 뒤 평소와 동일하게 주문하면 혜택이 자동 적용됩니다.",
            "수량이 한정된 상품은 조기 품절될 수 있습니다.",
          ],
        },
      ],
    },
  },
  {
    slug: "welcome-first-purchase",
    title: "첫 구매 혜택",
    desc: "신규 회원 정품 검수비 무료",
    period: "상시 진행",
    badge: "신규 회원",
    image: "/events/event-welcome-benefit.png",
    doc: {
      title: "첫 구매 혜택",
      description:
        "레미츄를 처음 이용하는 고객님께 첫 주문 전용 혜택을 드립니다.",
      updatedAt: "2026.06.30",
      sections: [
        {
          heading: "신규 회원 전용 혜택",
          paragraphs: [
            "회원 가입 후 첫 구매를 완료하면 정품 검수비가 무료로 적용됩니다.",
            "레미츄의 전문 검수 프로세스를 부담 없이 경험해보실 수 있도록 준비한 혜택입니다.",
          ],
          bullets: [
            "첫 구매 정품 검수비 무료",
            "관부가세 포함 가격 안내",
            "구매 후 검수 리포트 제공",
          ],
        },
        {
          heading: "이용 안내",
          paragraphs: [
            "혜택은 신규 회원의 첫 결제 1회에 한해 자동 적용됩니다.",
            "주문 취소 또는 환불 시 사용된 혜택은 복구되지 않을 수 있습니다.",
          ],
        },
      ],
    },
  },
  {
    slug: "seller-settlement-promo",
    title: "판매자 정산 프로모션",
    desc: "기간 한정 정산 수수료 인하",
    period: "2026.07.01 - 2026.07.31",
    badge: "판매 지원",
    image: "/events/event-seller-promo.png",
    doc: {
      title: "판매자 정산 프로모션",
      description:
        "잠들어 있는 명품을 더 좋은 조건으로 판매할 수 있도록 정산 수수료를 낮췄습니다.",
      updatedAt: "2026.06.30",
      sections: [
        {
          heading: "프로모션 내용",
          paragraphs: [
            "행사 기간 내 위탁 판매 접수 상품은 판매 완료 시 적용되는 정산 수수료가 인하됩니다.",
            "전문 촬영, 정품 검수, 상세 페이지 등록까지 레미츄가 함께 진행합니다.",
          ],
          bullets: [
            "위탁 판매 정산 수수료 인하",
            "전문 검수 및 촬영 지원",
            "판매 완료 후 빠른 정산",
          ],
        },
        {
          heading: "접수 방법",
          paragraphs: [
            "판매하기 메뉴에서 상품 사진과 기본 정보를 등록하면 담당자가 예상 시세와 진행 절차를 안내합니다.",
            "브랜드, 모델, 컨디션에 따라 프로모션 적용 가능 여부가 달라질 수 있습니다.",
          ],
        },
      ],
    },
  },
];

export function getEventPost(slug: string): EventPost | undefined {
  return eventPosts.find((event) => event.slug === slug);
}
