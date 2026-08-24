import { NextResponse } from "next/server";
import { FirebaseAuthError, requireFirebaseUser } from "@/lib/firebase-admin";
import {
  createProductReview,
  getProductReviewEligibility,
  listPublishedProductReviews,
} from "@/lib/reviews-admin";
import {
  getReviewSummary,
  normalizeProductId,
  ReviewWriteError,
  validateReviewDraft,
} from "@/lib/reviews";

export const runtime = "nodejs";

async function optionalFirebaseUser(req: Request) {
  try {
    return await requireFirebaseUser(req);
  } catch (error) {
    if (error instanceof FirebaseAuthError) return null;
    throw error;
  }
}

export async function GET(req: Request) {
  try {
    const productId = normalizeProductId(new URL(req.url).searchParams.get("productId"));
    if (!productId) {
      return NextResponse.json(
        { ok: false, message: "상품 정보가 올바르지 않아요." },
        { status: 400 }
      );
    }

    const user = await optionalFirebaseUser(req);
    const reviews = await listPublishedProductReviews(productId, user?.uid);

    return NextResponse.json({
      ok: true,
      reviews,
      summary: getReviewSummary(reviews),
    });
  } catch (error) {
    console.error("[reviews] list failed", error);
    return NextResponse.json(
      { ok: false, message: "리뷰를 불러오지 못했어요." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireFirebaseUser(req);
    const body = (await req.json().catch(() => null)) as {
      productId?: unknown;
      rating?: unknown;
      body?: unknown;
      photoUrls?: unknown;
    } | null;
    const productId = normalizeProductId(body?.productId);

    if (!productId) {
      return NextResponse.json(
        { ok: false, message: "상품 정보가 올바르지 않아요." },
        { status: 400 }
      );
    }

    const draft = validateReviewDraft({
      rating: body?.rating,
      body: body?.body,
      photoUrls: body?.photoUrls,
    });
    const created = await createProductReview({
      userId: user.uid,
      userName:
        (typeof user.name === "string" && user.name) ||
        user.email?.split("@")[0] ||
        "구매자",
      productId,
      draft,
    });
    const reviews = await listPublishedProductReviews(productId, user.uid);
    const eligibility = await getProductReviewEligibility(user.uid, productId);

    return NextResponse.json({
      ok: true,
      review: created.review,
      pointsGranted: created.pointsGranted,
      summary: getReviewSummary(reviews),
      eligibility,
    });
  } catch (error) {
    if (error instanceof FirebaseAuthError) {
      return NextResponse.json(
        { ok: false, error: "NEED_LOGIN", message: "로그인 후 리뷰를 작성할 수 있어요." },
        { status: 401 }
      );
    }

    if (error instanceof ReviewWriteError) {
      return NextResponse.json(
        { ok: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error("[reviews] create failed", error);
    return NextResponse.json(
      { ok: false, message: "리뷰를 등록하지 못했어요." },
      { status: 500 }
    );
  }
}
