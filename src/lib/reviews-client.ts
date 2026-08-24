import { getFirebaseIdToken } from "@/lib/auth";
import { getReviewSummary, type ProductReview, type ReviewEligibility, type ReviewSummary } from "@/lib/reviews";

async function authHeaders(): Promise<HeadersInit | undefined> {
  const token = await getFirebaseIdToken().catch(() => null);
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
}

async function readJson(response: Response) {
  return (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    message?: string;
    reviews?: ProductReview[];
    review?: ProductReview;
    summary?: ReviewSummary;
    eligibility?: ReviewEligibility;
    pointsGranted?: number;
  };
}

export async function fetchProductReviews(productId: string) {
  const response = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  const json = await readJson(response);

  if (!response.ok) {
    throw new Error(json.message || "리뷰를 불러오지 못했어요.");
  }

  const reviews = json.reviews ?? [];
  return {
    reviews,
    summary: json.summary ?? getReviewSummary(reviews),
  };
}

export async function fetchReviewEligibility(productId: string) {
  const response = await fetch(
    `/api/reviews/eligibility?productId=${encodeURIComponent(productId)}`,
    {
      headers: await authHeaders(),
      cache: "no-store",
    }
  );
  const json = await readJson(response);

  if (!response.ok || !json.eligibility) {
    throw new Error(json.message || "리뷰 작성 가능 여부를 확인하지 못했어요.");
  }

  return json.eligibility;
}

export async function submitProductReview({
  productId,
  rating,
  body,
  photoUrls,
}: {
  productId: string;
  rating: number;
  body: string;
  photoUrls: string[];
}) {
  const token = await getFirebaseIdToken();
  if (!token) {
    throw new Error("로그인 후 리뷰를 작성할 수 있어요.");
  }

  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId, rating, body, photoUrls }),
  });
  const json = await readJson(response);

  if (!response.ok || !json.review) {
    throw new Error(json.message || "리뷰를 등록하지 못했어요.");
  }

  return {
    review: json.review,
    pointsGranted: json.pointsGranted ?? 0,
    summary: json.summary,
  };
}
