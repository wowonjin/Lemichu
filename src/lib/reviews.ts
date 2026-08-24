export const REVIEW_MIN_BODY = 10;
export const REVIEW_MAX_BODY = 500;
export const REVIEW_MAX_PHOTOS = 3;
export const REVIEW_WINDOW_DAYS = 90;
export const REVIEW_TEXT_POINTS = 100;
export const REVIEW_PHOTO_POINTS = 500;
export const REVIEW_CHANGED_EVENT = "lemichu-product-reviews-changed";

export const REVIEWABLE_ORDER_STATUSES = ["delivered"] as const;
export const PURCHASED_ORDER_STATUSES = [
  "paid",
  "preparing",
  "shipping",
  "delivered",
] as const;

export const REVIEW_RATING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "아쉬워요",
  2: "보통이에요",
  3: "괜찮아요",
  4: "만족해요",
  5: "최고예요",
};

export type ReviewEligibilityStatus =
  | "eligible"
  | "need_login"
  | "not_purchased"
  | "pending_delivery"
  | "already_reviewed"
  | "window_expired";

export type ReviewSort = "newest" | "highest";

export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
  productId?: string;
  productName?: string;
  verified?: boolean;
  option?: string;
  photoUrls?: string[];
  createdAtMs?: number;
  isMine?: boolean;
};

export type ReviewSummary = {
  count: number;
  average: number;
  averageLabel: string;
  distribution: Array<{ score: number; count: number }>;
};

export type ReviewPurchaseCandidate = {
  orderId: string;
  status: string;
  items: Array<{
    productId?: string;
    option?: string;
    name?: string;
  }>;
  deliveredAtMs?: number;
  createdAtMs?: number;
};

export type ReviewEligibility = {
  status: ReviewEligibilityStatus;
  message: string;
  orderId?: string;
  option?: string;
  productName?: string;
  deadlineLabel?: string;
  existingReviewId?: string;
  points: {
    text: number;
    photo: number;
  };
};

export type ReviewDraftInput = {
  rating: unknown;
  body: unknown;
  photoUrls?: unknown;
};

export type ValidatedReviewDraft = {
  rating: number;
  body: string;
  photoUrls: string[];
};

export class ReviewWriteError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "ReviewWriteError";
    this.code = code;
    this.status = status;
  }
}

export const defaultProductReviews: ProductReview[] = [];

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PURCHASED_STATUS_SET = new Set<string>(PURCHASED_ORDER_STATUSES);

export function reviewDocumentId(userId: string, productId: string) {
  return `${userId}__${productId}`;
}

export function normalizeProductId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeReviewBody(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}

export function calculateReviewPoints(photoCount: number) {
  return photoCount > 0 ? REVIEW_PHOTO_POINTS : REVIEW_TEXT_POINTS;
}

export function getReviewDeadlineMs(deliveredAtMs: number) {
  return deliveredAtMs + REVIEW_WINDOW_DAYS * MS_PER_DAY;
}

export function isReviewWindowOpen(deliveredAtMs: number, nowMs = Date.now()) {
  return nowMs <= getReviewDeadlineMs(deliveredAtMs);
}

export function formatReviewDate(ms = Date.now()) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(ms))
    .replace(/\s/g, "");
}

export function formatReviewDeadline(ms: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(ms));
}

export function maskReviewAuthor(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "구매자";

  const base = trimmed.includes("@") ? trimmed.split("@")[0] || "구매자" : trimmed;
  if (base.length === 1) return `${base}*`;
  if (base.length === 2) return `${base[0]}*`;
  return `${base[0]}**`;
}

export function getReviewSummary(reviews: ProductReview[] = defaultProductReviews): ReviewSummary {
  const count = reviews.length;
  const average =
    count === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / count;

  return {
    count,
    average,
    averageLabel: average.toFixed(1),
    distribution: [5, 4, 3, 2, 1].map((score) => ({
      score,
      count: reviews.filter((review) => review.rating === score).length,
    })),
  };
}

export function sortProductReviews(reviews: ProductReview[], sort: ReviewSort = "newest") {
  return [...reviews].sort((a, b) => {
    if (sort === "highest" && a.rating !== b.rating) {
      return b.rating - a.rating;
    }

    return (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0);
  });
}

export function filterProductReviews(reviews: ProductReview[], rating?: number) {
  if (!rating) return reviews;
  return reviews.filter((review) => review.rating === rating);
}

export function eligibilityHttpStatus(status: ReviewEligibilityStatus) {
  if (status === "need_login") return 401;
  if (status === "already_reviewed") return 409;
  return 403;
}

export function eligibilityMessage(status: ReviewEligibilityStatus) {
  switch (status) {
    case "need_login":
      return "로그인 후 리뷰를 작성할 수 있어요.";
    case "not_purchased":
      return "이 상품을 구매한 뒤에 리뷰를 남길 수 있어요.";
    case "pending_delivery":
      return "배송이 완료되면 리뷰를 작성할 수 있어요.";
    case "already_reviewed":
      return "이미 이 상품의 리뷰를 작성했어요.";
    case "window_expired":
      return `리뷰 작성 기간(구매확정 후 ${REVIEW_WINDOW_DAYS}일)이 지났어요.`;
    default:
      return "구매 확정된 상품의 상태와 배송 경험을 남겨 주세요.";
  }
}

function matchingItem(candidate: ReviewPurchaseCandidate, productId: string) {
  return candidate.items.find((item) => item.productId === productId);
}

export function toReviewPurchases(
  orders: ReviewPurchaseCandidate[],
  productId: string
): Array<ReviewPurchaseCandidate & { option?: string; productName?: string }> {
  return orders
    .filter((order) => PURCHASED_STATUS_SET.has(order.status) && matchingItem(order, productId))
    .map((order) => {
      const item = matchingItem(order, productId);
      return {
        ...order,
        option: item?.option,
        productName: item?.name,
      };
    });
}

export function evaluateReviewEligibility({
  isLoggedIn,
  hasExistingReview,
  existingReviewId,
  orders,
  productId,
  nowMs = Date.now(),
}: {
  isLoggedIn: boolean;
  hasExistingReview: boolean;
  existingReviewId?: string;
  orders: ReviewPurchaseCandidate[];
  productId: string;
  nowMs?: number;
}): ReviewEligibility {
  const points = {
    text: REVIEW_TEXT_POINTS,
    photo: REVIEW_PHOTO_POINTS,
  };

  if (!isLoggedIn) {
    return { status: "need_login", message: eligibilityMessage("need_login"), points };
  }

  if (hasExistingReview) {
    return {
      status: "already_reviewed",
      message: eligibilityMessage("already_reviewed"),
      existingReviewId,
      points,
    };
  }

  const purchases = toReviewPurchases(orders, productId);
  if (purchases.length === 0) {
    return { status: "not_purchased", message: eligibilityMessage("not_purchased"), points };
  }

  const openWindows = purchases
    .filter(
      (order) =>
        order.status === "delivered" &&
        isReviewWindowOpen(order.deliveredAtMs ?? order.createdAtMs ?? 0, nowMs)
    )
    .sort(
      (a, b) =>
        (b.deliveredAtMs ?? b.createdAtMs ?? 0) - (a.deliveredAtMs ?? a.createdAtMs ?? 0)
    );

  if (openWindows[0]) {
    const selected = openWindows[0];
    const deliveredAt = selected.deliveredAtMs ?? selected.createdAtMs ?? nowMs;
    return {
      status: "eligible",
      message: eligibilityMessage("eligible"),
      orderId: selected.orderId,
      option: selected.option,
      productName: selected.productName,
      deadlineLabel: formatReviewDeadline(getReviewDeadlineMs(deliveredAt)),
      points,
    };
  }

  if (purchases.some((order) => order.status !== "delivered")) {
    return {
      status: "pending_delivery",
      message: eligibilityMessage("pending_delivery"),
      points,
    };
  }

  return {
    status: "window_expired",
    message: eligibilityMessage("window_expired"),
    points,
  };
}

function isAllowedReviewPhotoUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && value.length <= 2048;
  } catch {
    return false;
  }
}

function isLowQualityReviewBody(body: string) {
  const compact = body.replace(/\s/g, "");
  return compact.length >= REVIEW_MIN_BODY && /^(.)\1+$/.test(compact);
}

export function validateReviewDraft(input: ReviewDraftInput): ValidatedReviewDraft {
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ReviewWriteError("INVALID_RATING", "별점을 1점에서 5점 사이로 선택해 주세요.");
  }

  const body = normalizeReviewBody(input.body);
  if (body.length < REVIEW_MIN_BODY) {
    throw new ReviewWriteError(
      "INVALID_BODY",
      `리뷰는 ${REVIEW_MIN_BODY}자 이상 작성해 주세요.`
    );
  }
  if (body.length > REVIEW_MAX_BODY) {
    throw new ReviewWriteError(
      "INVALID_BODY",
      `리뷰는 ${REVIEW_MAX_BODY}자까지 작성할 수 있어요.`
    );
  }
  if (/<\/?[a-z][\s\S]*>/i.test(body)) {
    throw new ReviewWriteError("INVALID_BODY", "리뷰에 HTML 태그는 사용할 수 없어요.");
  }
  if (isLowQualityReviewBody(body)) {
    throw new ReviewWriteError("INVALID_BODY", "상품 경험에 대한 내용을 조금 더 구체적으로 적어 주세요.");
  }

  const rawPhotos = Array.isArray(input.photoUrls) ? input.photoUrls : [];
  if (rawPhotos.length > REVIEW_MAX_PHOTOS) {
    throw new ReviewWriteError(
      "INVALID_PHOTOS",
      `사진은 최대 ${REVIEW_MAX_PHOTOS}장까지 첨부할 수 있어요.`
    );
  }

  const photoUrls = rawPhotos.map((item) => (typeof item === "string" ? item.trim() : ""));
  if (photoUrls.some((url) => !isAllowedReviewPhotoUrl(url))) {
    throw new ReviewWriteError("INVALID_PHOTOS", "사진 주소가 올바르지 않아요.");
  }

  return {
    rating,
    body,
    photoUrls,
  };
}

export function canSubmitReviewDraft(input: ReviewDraftInput) {
  try {
    validateReviewDraft(input);
    return true;
  } catch {
    return false;
  }
}
