import type { InfoDoc } from "@/data/pageContent";

export const NOTICE_CATEGORIES = ["전체", "공지", "정책", "안내"] as const;

export type NoticeCategory = Exclude<(typeof NOTICE_CATEGORIES)[number], "전체">;

export type NoticeCta = {
  href: string;
  label: string;
};

export type NoticePost = {
  slug: string;
  title: string;
  date: string;
  category: NoticeCategory;
  bannerId?: string;
  cta?: NoticeCta;
  doc: InfoDoc;
};

export const noticePosts: NoticePost[] = [
  {
    slug: "welcome-coupon",
    bannerId: "welcome-coupon",
    title: "신규가입 즉시 5,000원 쿠폰 안내",
    date: "2026.09.04",
    category: "안내",
    cta: { href: "/signup", label: "회원가입하고 쿠폰 받기" },
    doc: {
      title: "신규가입 즉시 5,000원 쿠폰 안내",
      description:
        "레미츄에 처음 가입하는 고객님께 바로 사용할 수 있는 5,000원 할인 쿠폰을 드립니다.",
      updatedAt: "2026.09.04",
      sections: [
        {
          heading: "혜택 내용",
          paragraphs: [
            "회원가입이 완료되는 즉시 5,000원 할인 쿠폰이 계정에 지급됩니다.",
            "별도 다운로드나 인증 절차 없이, 결제 단계에서 자동으로 사용할 수 있습니다.",
          ],
          bullets: [
            "가입 즉시 5,000원 쿠폰 지급",
            "첫 주문부터 바로 사용 가능",
            "관부가세 포함가에도 할인 적용",
          ],
        },
        {
          heading: "참여 방법",
          paragraphs: [
            "회원가입 페이지에서 필요한 정보를 입력하고 가입을 완료하면 쿠폰이 자동 발급됩니다.",
            "이미 가입한 회원에게는 동일 혜택이 중복 지급되지 않습니다.",
          ],
        },
        {
          heading: "유의사항",
          paragraphs: [
            "쿠폰은 회원 계정 1개당 1회 지급되며, 탈퇴 후 재가입 시 다시 제공되지 않을 수 있습니다.",
            "일부 특가·프로모션 상품에는 쿠폰 사용이 제한될 수 있습니다.",
          ],
        },
      ],
    },
  },
  {
    slug: "ss-new",
    bannerId: "ss-new",
    title: "27SS 신상 할인 상품 안내",
    date: "2026.09.04",
    category: "안내",
    cta: { href: "/products?filter=new", label: "27SS 신상 구경하기" },
    doc: {
      title: "27SS 신상 할인 상품 안내",
      description:
        "2027 봄·여름 시즌 신상 명품을 레미츄에서 먼저 만나보세요. 신규 입고 상품을 중심으로 할인 혜택을 적용합니다.",
      updatedAt: "2026.09.04",
      sections: [
        {
          heading: "어떤 상품이 들어오나요?",
          paragraphs: [
            "27SS 시즌에 맞춰 가방, 지갑, 슈즈, 액세서리 등 지금 가장 많이 찾는 신상 모델을 순차 입고합니다.",
            "정품 검수를 마친 상품만 신규입고 목록에 노출되며, 입고 직후 할인 적용 상품을 함께 확인할 수 있습니다.",
          ],
          bullets: [
            "시즌 신상 모델 우선 입고",
            "검수 완료 상품만 판매",
            "신규입고 필터에서 한눈에 확인",
          ],
        },
        {
          heading: "보는 방법",
          paragraphs: [
            "상품 목록에서 신규입고 필터를 선택하면 최근 들어온 27SS 신상과 할인 상품을 모아볼 수 있습니다.",
            "수량이 적은 모델은 조기 품절될 수 있으니, 관심 상품은 빠르게 확인해 주세요.",
          ],
        },
      ],
    },
  },
  {
    slug: "summer-week",
    bannerId: "summer-week",
    title: "여름 특가 위크, 시즌 인기 명품 특가",
    date: "2026.09.04",
    category: "공지",
    cta: { href: "/events/summer-special-week", label: "특가 위크 자세히 보기" },
    doc: {
      title: "여름 특가 위크, 시즌 인기 명품 특가",
      description:
        "여름 시즌에 가장 많이 찾는 인기 명품을 레미츄 단독 특가로 만나보세요.",
      updatedAt: "2026.09.04",
      sections: [
        {
          heading: "행사 혜택",
          paragraphs: [
            "여름 특가 위크 기간 동안 선정된 시즌 인기 상품을 특별 할인가로 제공합니다.",
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
        {
          heading: "행사 기간",
          paragraphs: [
            "2026.07.01 – 2026.07.14에 진행된 여름 특가 위크 혜택과 대상 상품 안내는 이벤트 페이지에서 계속 확인할 수 있습니다.",
          ],
        },
      ],
    },
  },
  {
    slug: "free-shipping",
    bannerId: "free-shipping",
    title: "전상품 무료배송 · 관부가세 포함가 안내",
    date: "2026.09.04",
    category: "안내",
    cta: { href: "/policy/delivery", label: "배송 정책 자세히 보기" },
    doc: {
      title: "전상품 무료배송 · 관부가세 포함가 안내",
      description:
        "레미츄의 모든 상품은 무료배송이며, 관세와 부가세가 포함된 가격으로 결제됩니다.",
      updatedAt: "2026.09.04",
      sections: [
        {
          heading: "무료배송",
          paragraphs: [
            "별도의 배송비 없이 주문하신 상품을 받아보실 수 있습니다.",
            "해외 현지 구매 상품은 평균 8-15일, ‘오늘출고’ 또는 ‘국내배송’ 표기 상품은 1-3일 내 수령하실 수 있습니다.",
          ],
        },
        {
          heading: "관부가세 포함가",
          paragraphs: [
            "모든 상품은 관세 및 부가세가 포함된 가격으로 판매됩니다.",
            "결제 이후 추가로 관부가세를 납부할 필요가 없습니다.",
          ],
          bullets: [
            "전상품 무료배송",
            "관부가세 포함 가격 표시",
            "수령 시 추가 비용 없음",
          ],
        },
        {
          heading: "교환 · 반품",
          paragraphs: [
            "레미츄는 고객님의 주문에 맞춰 구매하는 구매대행 방식으로 운영됩니다. 단순 변심이나 옵션 선택 오류로 인한 취소·반품은 어렵습니다.",
            "상품 하자, 오배송 또는 판매자 과실이 있는 경우 수령 후 1-2일 내 고객센터로 문의해 주시면 교환 또는 환불을 도와드립니다.",
          ],
        },
      ],
    },
  },
  {
    slug: "guarantee",
    bannerId: "guarantee",
    title: "가품 판정 시 결제금액 200% 보상 안내",
    date: "2026.09.04",
    category: "정책",
    cta: { href: "/policy/guarantee", label: "보상 정책 자세히 보기" },
    doc: {
      title: "가품 판정 시 결제금액 200% 보상 안내",
      description:
        "레미츄에서 구매한 상품이 공인 감정 기관에서 가품으로 판정되면 결제 금액의 200%를 보상합니다.",
      updatedAt: "2026.09.04",
      sections: [
        {
          heading: "200% 보상 원칙",
          paragraphs: [
            "레미츄는 모든 상품의 정품 여부를 책임집니다.",
            "공인된 감정 기관을 통해 가품으로 판정될 경우, 결제 금액의 200%를 보상해 드립니다. 보상은 판정 리포트 확인 후 영업일 기준 3일 이내에 처리됩니다.",
          ],
        },
        {
          heading: "보상 신청 방법",
          paragraphs: ["아래 절차에 따라 보상을 신청하실 수 있습니다."],
          bullets: [
            "공인 감정 기관의 가품 판정서 확보",
            "고객센터 카카오톡으로 판정서 제출",
            "검토 후 보상금 지급 및 상품 회수 안내",
          ],
        },
        {
          heading: "유의사항",
          paragraphs: [
            "보상은 레미츄를 통해 정상적으로 결제·배송된 상품에 한합니다.",
            "고객의 임의 수선·훼손이 확인된 경우 보상이 제한될 수 있습니다.",
          ],
        },
      ],
    },
  },
  {
    slug: "first-purchase",
    bannerId: "first-purchase",
    title: "첫 구매 정품 검수비 무료 혜택 안내",
    date: "2026.09.04",
    category: "안내",
    cta: { href: "/events/welcome-first-purchase", label: "첫 구매 혜택 자세히 보기" },
    doc: {
      title: "첫 구매 정품 검수비 무료 혜택 안내",
      description:
        "레미츄를 처음 이용하는 고객님께 첫 주문 전용 정품 검수비 무료 혜택을 드립니다.",
      updatedAt: "2026.09.04",
      sections: [
        {
          heading: "신규 회원 전용 혜택",
          paragraphs: [
            "회원 가입 후 첫 구매를 완료하면 정품 검수비가 무료로 적용됩니다.",
            "레미츄의 전문 검수 프로세스를 부담 없이 경험해 보실 수 있도록 준비한 혜택입니다.",
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
    slug: "service-open",
    title: "레미츄 서비스 오픈 안내",
    date: "2026.06.29",
    category: "공지",
    doc: {
      title: "레미츄 서비스 오픈 안내",
      description:
        "정품 검수 명품을 안심하고 구매할 수 있는 레미츄가 서비스를 시작합니다.",
      updatedAt: "2026.06.29",
      sections: [
        {
          heading: "레미츄를 소개합니다",
          paragraphs: [
            "레미츄는 공식 매장·백화점·공식 유통처를 통해 상품을 확보하고, 출고 전 전문 검수를 거쳐 정품만 판매합니다.",
            "관부가세 포함가, 전상품 무료배송, 가품 판정 시 200% 보상으로 구매 이후까지 책임집니다.",
          ],
        },
        {
          heading: "함께 이용할 수 있는 서비스",
          paragraphs: ["오픈과 함께 아래 서비스를 이용하실 수 있습니다."],
          bullets: [
            "정품 검수 완료 명품 쇼핑",
            "신규 회원 쿠폰 및 첫 구매 혜택",
            "위탁 판매와 예상 시세 확인",
            "카카오톡 고객센터 상담",
          ],
        },
      ],
    },
  },
  {
    slug: "authentication-policy",
    title: "정품 검수 및 보상 정책 안내",
    date: "2026.06.29",
    category: "정책",
    cta: { href: "/authentication", label: "정품 검수 안내 보기" },
    doc: {
      title: "정품 검수 및 보상 정책 안내",
      description:
        "카테고리별 전문 검수팀이 모든 상품의 정품 여부를 확인하고, 가품 판정 시 결제 금액을 보상합니다.",
      updatedAt: "2026.06.29",
      sections: [
        {
          heading: "검수 원칙",
          paragraphs: [
            "레미츄는 카테고리별 전문 검수팀과 다단계 검수 프로세스로 정품만을 판매합니다.",
            "검수를 통과한 상품만 포장하여 고객님께 발송합니다.",
          ],
        },
        {
          heading: "보상 정책",
          paragraphs: [
            "공인 감정 기관에서 가품으로 판정된 경우 결제 금액의 200%를 보상합니다.",
            "자세한 신청 절차와 제한 사항은 가품 보상 정책 페이지에서 확인할 수 있습니다.",
          ],
        },
      ],
    },
  },
  {
    slug: "customer-hours",
    title: "고객센터 운영시간 안내",
    date: "2026.06.29",
    category: "안내",
    cta: { href: "/faq", label: "자주 묻는 질문 보기" },
    doc: {
      title: "고객센터 운영시간 안내",
      description: "주문, 배송, 검수, 보상 문의는 아래 시간에 상담해 드립니다.",
      updatedAt: "2026.06.29",
      sections: [
        {
          heading: "운영시간",
          paragraphs: ["평일 상담을 기준으로 운영합니다. 주말·공휴일은 휴무입니다."],
          bullets: [
            "운영시간: 평일 10:00 – 18:00",
            "점심시간: 12:30 – 13:30",
            "주말 및 공휴일 휴무",
          ],
        },
        {
          heading: "문의 방법",
          paragraphs: [
            "가장 빠른 상담은 카카오톡 고객센터입니다. 이메일 문의는 lemichu@naver.com으로 보내 주세요.",
            "운영시간 이후 접수된 문의는 다음 영업일에 순차 답변드립니다.",
          ],
        },
      ],
    },
  },
];

export function getNoticePost(slug: string): NoticePost | undefined {
  return noticePosts.find((notice) => notice.slug === slug);
}

export function getNoticeHrefByBannerId(bannerId: string): string | undefined {
  const notice = noticePosts.find((item) => item.bannerId === bannerId);
  return notice ? `/notices/${notice.slug}` : undefined;
}

export function filterNoticePosts(category?: string) {
  if (!category || category === "전체") return noticePosts;
  return noticePosts.filter((notice) => notice.category === category);
}
