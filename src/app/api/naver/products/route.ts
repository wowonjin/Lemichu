import { NextResponse } from "next/server";
import { registerNaverProduct } from "@/lib/naver/products";
import { getNaverConfig, NaverConfigError } from "@/lib/naver/config";
import { NaverApiError } from "@/lib/naver/client";
import { NaverAuthError } from "@/lib/naver/auth";
import type { NaverProductInput } from "@/lib/naver/types";

export const runtime = "nodejs";

/** 네이버 커머스 API 설정 여부 확인용 */
export async function GET() {
  return NextResponse.json({ configured: getNaverConfig() != null });
}

const requiredFields: Array<keyof NaverProductInput> = [
  "name",
  "leafCategoryId",
  "salePrice",
  "stockQuantity",
  "representativeImageUrl",
  "detailContent",
  "originAreaCode",
  "afterServiceTelephoneNumber",
  "afterServiceGuideContent",
];

export async function POST(request: Request) {
  let input: NaverProductInput;
  try {
    input = (await request.json()) as NaverProductInput;
  } catch {
    return NextResponse.json(
      { ok: false, message: "요청 본문(JSON)을 해석하지 못했습니다." },
      { status: 400 }
    );
  }

  const missing = requiredFields.filter((field) => {
    const value = input?.[field];
    return value === undefined || value === null || value === "";
  });
  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, message: `필수 항목 누락: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const result = await registerNaverProduct(input);
    const channel = result.channelProducts?.[0];
    return NextResponse.json({
      ok: true,
      result,
      originProductNo: result.originProductNo ?? channel?.originProductNo,
      channelProductNo: result.smartstoreChannelProductNo ?? channel?.channelProductNo,
    });
  } catch (error) {
    if (error instanceof NaverConfigError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 503 });
    }
    if (error instanceof NaverAuthError) {
      return NextResponse.json(
        { ok: false, message: `네이버 인증 실패: ${error.message}`, code: error.code },
        { status: 502 }
      );
    }
    if (error instanceof NaverApiError) {
      return NextResponse.json(
        {
          ok: false,
          message: error.toDisplayMessage(),
          code: error.code,
          invalidInputs: error.invalidInputs,
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "네이버 상품 등록 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
