import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  calculateReviewPoints,
  eligibilityHttpStatus,
  eligibilityMessage,
  evaluateReviewEligibility,
  formatReviewDate,
  isReviewWindowOpen,
  maskReviewAuthor,
  reviewDocumentId,
  ReviewWriteError,
  type ProductReview,
  type ReviewEligibility,
  type ReviewPurchaseCandidate,
  type ValidatedReviewDraft,
} from "@/lib/reviews";

type OrderDoc = {
  userId?: string;
  status?: string;
  items?: Array<{
    productId?: string;
    option?: string;
    name?: string;
  }>;
  createdAt?: { toMillis?: () => number; seconds?: number; _seconds?: number };
  updatedAt?: { toMillis?: () => number; seconds?: number; _seconds?: number };
};

type ReviewDoc = {
  productId?: string;
  productName?: string;
  userId?: string;
  author?: string;
  rating?: number;
  body?: string;
  photoUrls?: string[];
  verified?: boolean;
  option?: string;
  orderId?: string;
  createdAt?: { toMillis?: () => number; seconds?: number; _seconds?: number };
};

function toMillis(value: unknown) {
  if (!value || typeof value !== "object") return 0;

  const timestamp = value as {
    toMillis?: () => number;
    seconds?: number;
    _seconds?: number;
  };

  if (typeof timestamp.toMillis === "function") {
    try {
      return timestamp.toMillis();
    } catch {
      // Admin Timestamp can throw if `this` is detached.
    }
  }

  const seconds = timestamp.seconds ?? timestamp._seconds;
  return typeof seconds === "number" ? seconds * 1000 : 0;
}

function toPublicReview(
  id: string,
  data: ReviewDoc,
  viewerId?: string
): ProductReview {
  const createdAtMs = toMillis(data.createdAt);
  return {
    id,
    author: data.author || "구매자",
    rating: Number(data.rating) || 0,
    date: formatReviewDate(createdAtMs || Date.now()),
    body: data.body || "",
    productId: data.productId,
    productName: data.productName,
    verified: Boolean(data.verified),
    option: data.option,
    photoUrls: Array.isArray(data.photoUrls) ? data.photoUrls : [],
    createdAtMs,
    isMine: Boolean(viewerId && data.userId === viewerId),
  };
}

function toPurchaseCandidates(
  docs: Array<{ id: string; data: () => unknown }>
): ReviewPurchaseCandidate[] {
  return docs.map((doc) => {
    const data = doc.data() as OrderDoc;
    const createdAtMs = toMillis(data.createdAt);
    const updatedAtMs = toMillis(data.updatedAt);
    return {
      orderId: doc.id,
      status: data.status || "",
      items: Array.isArray(data.items) ? data.items : [],
      createdAtMs,
      deliveredAtMs: data.status === "delivered" ? updatedAtMs || createdAtMs : createdAtMs,
    };
  });
}

export async function listPublishedProductReviews(
  productId: string,
  viewerId?: string
): Promise<ProductReview[]> {
  if (!productId) return [];

  try {
    const snapshot = await getAdminDb()
      .collection("reviews")
      .where("productId", "==", productId)
      .get();

    return snapshot.docs
      .map((doc) => toPublicReview(doc.id, doc.data() as ReviewDoc, viewerId))
      .sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
  } catch (error) {
    console.error("[reviews] failed to list product reviews", error);
    return [];
  }
}

export async function getProductReviewEligibility(
  userId: string | undefined,
  productId: string
): Promise<ReviewEligibility> {
  if (!userId) {
    return evaluateReviewEligibility({
      isLoggedIn: false,
      hasExistingReview: false,
      orders: [],
      productId,
    });
  }

  const db = getAdminDb();
  const [reviewSnap, orderSnap] = await Promise.all([
    db.collection("reviews").doc(reviewDocumentId(userId, productId)).get(),
    db.collection("orders").where("userId", "==", userId).get(),
  ]);

  return evaluateReviewEligibility({
    isLoggedIn: true,
    hasExistingReview: reviewSnap.exists,
    existingReviewId: reviewSnap.exists ? reviewSnap.id : undefined,
    orders: toPurchaseCandidates(orderSnap.docs),
    productId,
  });
}

export async function createProductReview({
  userId,
  userName,
  productId,
  draft,
}: {
  userId: string;
  userName: string;
  productId: string;
  draft: ValidatedReviewDraft;
}) {
  const db = getAdminDb();
  const reviewId = reviewDocumentId(userId, productId);
  const reviewRef = db.collection("reviews").doc(reviewId);
  const [existingReview, orderSnap] = await Promise.all([
    reviewRef.get(),
    db.collection("orders").where("userId", "==", userId).get(),
  ]);
  const eligibility = evaluateReviewEligibility({
    isLoggedIn: true,
    hasExistingReview: existingReview.exists,
    existingReviewId: existingReview.exists ? existingReview.id : undefined,
    orders: toPurchaseCandidates(orderSnap.docs),
    productId,
  });

  if (eligibility.status !== "eligible" || !eligibility.orderId) {
    throw new ReviewWriteError(
      eligibility.status.toUpperCase(),
      eligibility.message,
      eligibilityHttpStatus(eligibility.status)
    );
  }

  const orderRef = db.collection("orders").doc(eligibility.orderId);
  const userRef = db.collection("users").doc(userId);
  const ledgerRef = userRef.collection("pointLedger").doc(`review_${reviewId}`);
  const points = calculateReviewPoints(draft.photoUrls.length);
  const author = maskReviewAuthor(userName);

  await db.runTransaction(async (tx) => {
    const [existingReview, orderDoc] = await Promise.all([tx.get(reviewRef), tx.get(orderRef)]);

    if (existingReview.exists) {
      throw new ReviewWriteError("ALREADY_REVIEWED", "이미 이 상품의 리뷰를 작성했어요.", 409);
    }

    const order = orderDoc.data() as OrderDoc | undefined;
    if (!orderDoc.exists || !order || order.userId !== userId || order.status !== "delivered") {
      throw new ReviewWriteError(
        "PENDING_DELIVERY",
        eligibilityMessage("pending_delivery"),
        403
      );
    }

    const deliveredAtMs = toMillis(order.updatedAt) || toMillis(order.createdAt);
    if (!isReviewWindowOpen(deliveredAtMs)) {
      throw new ReviewWriteError(
        "WINDOW_EXPIRED",
        eligibilityMessage("window_expired"),
        403
      );
    }

    tx.create(reviewRef, {
      productId,
      productName: eligibility.productName || "",
      userId,
      author,
      rating: draft.rating,
      body: draft.body,
      photoUrls: draft.photoUrls,
      verified: true,
      orderId: eligibility.orderId,
      option: eligibility.option || "",
      pointsGranted: points,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (points > 0) {
      tx.set(
        userRef,
        {
          points: FieldValue.increment(points),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      tx.set(ledgerRef, {
        type: "earn",
        amount: points,
        reason: draft.photoUrls.length > 0 ? "포토 리뷰 작성 적립" : "리뷰 작성 적립",
        orderId: eligibility.orderId,
        reviewId,
        productId,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return {
    review: {
      id: reviewId,
      author,
      rating: draft.rating,
      date: formatReviewDate(),
      body: draft.body,
      productId,
      productName: eligibility.productName,
      verified: true,
      option: eligibility.option,
      photoUrls: draft.photoUrls,
      createdAtMs: Date.now(),
      isMine: true,
    } satisfies ProductReview,
    pointsGranted: points,
  };
}
