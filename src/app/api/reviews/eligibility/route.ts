import { NextResponse } from "next/server";
import { FirebaseAuthError, requireFirebaseUser } from "@/lib/firebase-admin";
import { getProductReviewEligibility } from "@/lib/reviews-admin";
import { normalizeProductId } from "@/lib/reviews";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const productId = normalizeProductId(new URL(req.url).searchParams.get("productId"));
    if (!productId) {
      return NextResponse.json(
        { ok: false, message: "상품 정보가 올바르지 않아요." },
        { status: 400 }
      );
    }

    let userId: string | undefined;
    try {
      const user = await requireFirebaseUser(req);
      userId = user.uid;
    } catch (error) {
      if (!(error instanceof FirebaseAuthError)) throw error;
    }

    return NextResponse.json({
      ok: true,
      eligibility: await getProductReviewEligibility(userId, productId),
    });
  } catch (error) {
    console.error("[reviews] eligibility failed", error);
    return NextResponse.json(
      { ok: false, message: "리뷰 작성 가능 여부를 확인하지 못했어요." },
      { status: 500 }
    );
  }
}
