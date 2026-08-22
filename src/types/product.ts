export type ConditionGrade = "NEW" | "S" | "A" | "B";

export type AuthenticationStatus = "VERIFIED" | "PENDING" | "BRAND_OFFICIAL";

export type DeliveryBadge = "오늘출고" | "국내배송" | "해외배송" | "예약배송";

export type ProductAvailability = "available" | "temporarily_unavailable" | "sold";

export type Product = {
  id: string;
  brand: string;
  name: string;
  imageUrl: string;
  imageUrls?: string[];
  price: number;
  retailPrice?: number;
  discountRate?: number;
  color?: string;
  size?: string;
  detailContent?: string;
  condition?: ConditionGrade;
  isPreOwned: boolean;
  categoryId?: string;
  authenticationStatus: AuthenticationStatus;
  deliveryBadge: DeliveryBadge;
  badges: string[];
  href: string;
  availability?: ProductAvailability;
  stockQuantity?: number;
};

export type RankedProduct = Product & {
  rank: number;
  /** positive = 순위 상승, negative = 하락, 0 = 유지, "new" = 신규 진입 */
  trend: number | "new";
};
