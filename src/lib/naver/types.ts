/**
 * 우리 쇼핑몰 상품을 네이버 스마트스토어에 등록할 때 사용하는 입력 모델.
 * (클라이언트/서버 공용 타입이므로 server-only 를 import 하지 않습니다.)
 */
export type NaverProductInput = {
  /** 상품명 */
  name: string;
  /** 리프 카테고리 ID (네이버 카테고리 조회 API로 확인한 말단 카테고리) */
  leafCategoryId: string;
  /** 판매가 (원, 정수) */
  salePrice: number;
  /** 재고 수량 */
  stockQuantity: number;
  /** 대표 이미지 URL (외부에서 접근 가능한 https URL) */
  representativeImageUrl: string;
  /** 추가 이미지 URL 목록 (선택) */
  optionalImageUrls?: string[];
  /** 상품 상세 HTML (BODY/SCRIPT/STYLE 등 일부 태그는 필터링됨) */
  detailContent: string;
  /** 배송비 (원). 0 이면 무료배송으로 처리 */
  deliveryFee: number;
  /** 원산지 코드 (네이버 원산지 코드. 예: 국산 일부 코드) */
  originAreaCode: string;
  /** 원산지 보조 설명 (선택) */
  originAreaContent?: string;
  /** A/S 전화번호 */
  afterServiceTelephoneNumber: string;
  /** A/S 안내 내용 */
  afterServiceGuideContent: string;
  /** 브랜드명 (선택) */
  brandName?: string;
  /** 제조사명 (선택) */
  manufacturerName?: string;
  /** 모델명 (선택) */
  modelName?: string;
  /** 미성년자 구매 가능 여부 (기본 true) */
  minorPurchasable?: boolean;
  /** 전시 상태 (ON | SUSPENSION, 기본 ON) */
  displayStatus?: "ON" | "SUSPENSION";
};

/** 커머스 API (v2) 상품 등록 요청 바디 */
export type NaverCreateProductPayload = {
  originProduct: NaverOriginProduct;
  smartstoreChannelProduct: NaverSmartstoreChannelProduct;
};

export type NaverOriginProduct = {
  statusType: "SALE" | "OUTOFSTOCK" | "SUSPENSION" | "CLOSE";
  saleType?: "NEW" | "OLD";
  leafCategoryId: string;
  name: string;
  detailContent: string;
  images: {
    representativeImage: { url: string };
    optionalImages?: Array<{ url: string }>;
  };
  salePrice: number;
  stockQuantity: number;
  deliveryInfo: NaverDeliveryInfo;
  detailAttribute: NaverDetailAttribute;
};

export type NaverDeliveryInfo = {
  deliveryType: "DELIVERY" | "DIRECT" | "NOTHING";
  deliveryAttributeType?: "NORMAL" | "TODAY" | "OPTION_TODAY";
  deliveryCompany?: string;
  deliveryFee: {
    deliveryFeeType: "FREE" | "PAID" | "CONDITIONAL_FREE";
    baseFee?: number;
  };
};

export type NaverDetailAttribute = {
  minorPurchasable: boolean;
  naverShoppingSearchInfo?: {
    manufacturerName?: string;
    brandName?: string;
    modelName?: string;
  };
  originAreaInfo: {
    originAreaCode: string;
    content?: string;
  };
  afterServiceInfo: {
    afterServiceTelephoneNumber: string;
    afterServiceGuideContent: string;
  };
};

export type NaverSmartstoreChannelProduct = {
  channelProductName?: string;
  naverShoppingRegistration: boolean;
  channelProductDisplayStatusType: "ON" | "SUSPENSION";
};

/** (v2) 상품 등록 성공 응답 */
export type NaverCreateProductResult = {
  originProductNo?: number;
  smartstoreChannelProductNo?: number;
  channelProducts?: Array<{
    originProductNo?: number;
    channelProductNo?: number;
    channelServiceType?: string;
  }>;
};
