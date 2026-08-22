import "server-only";
import { naverFetch } from "@/lib/naver/client";
import type {
  NaverCreateProductPayload,
  NaverCreateProductResult,
  NaverProductInput,
} from "@/lib/naver/types";

/**
 * 우리 상품 입력값을 커머스 API (v2) 상품 등록 페이로드로 변환합니다.
 *
 * 커뮤니티에서 자주 발생하는 오류를 방지하기 위한 규칙:
 *  - smartstoreChannelProduct 는 originProduct 와 같은 최상위에 위치 (중첩 금지)
 *  - channelProductDisplayStatusType 은 ON | SUSPENSION 만 허용
 *  - skuYn 은 포함하지 않음 (네이버 풀필먼트 전용)
 */
export function buildCreateProductPayload(
  input: NaverProductInput
): NaverCreateProductPayload {
  const optionalImages =
    input.optionalImageUrls && input.optionalImageUrls.length > 0
      ? input.optionalImageUrls.filter(Boolean).map((url) => ({ url }))
      : undefined;

  const isFree = !input.deliveryFee || input.deliveryFee <= 0;

  return {
    originProduct: {
      statusType: "SALE",
      saleType: "NEW",
      leafCategoryId: input.leafCategoryId,
      name: input.name,
      detailContent: input.detailContent,
      images: {
        representativeImage: { url: input.representativeImageUrl },
        ...(optionalImages ? { optionalImages } : {}),
      },
      salePrice: Math.round(input.salePrice),
      stockQuantity: Math.max(0, Math.round(input.stockQuantity)),
      deliveryInfo: {
        deliveryType: "DELIVERY",
        deliveryAttributeType: "NORMAL",
        deliveryFee: isFree
          ? { deliveryFeeType: "FREE" }
          : { deliveryFeeType: "PAID", baseFee: Math.round(input.deliveryFee) },
      },
      detailAttribute: {
        minorPurchasable: input.minorPurchasable ?? true,
        naverShoppingSearchInfo: {
          ...(input.manufacturerName ? { manufacturerName: input.manufacturerName } : {}),
          ...(input.brandName ? { brandName: input.brandName } : {}),
          ...(input.modelName ? { modelName: input.modelName } : {}),
        },
        originAreaInfo: {
          originAreaCode: input.originAreaCode,
          ...(input.originAreaContent ? { content: input.originAreaContent } : {}),
        },
        afterServiceInfo: {
          afterServiceTelephoneNumber: input.afterServiceTelephoneNumber,
          afterServiceGuideContent: input.afterServiceGuideContent,
        },
      },
    },
    smartstoreChannelProduct: {
      channelProductName: input.name,
      naverShoppingRegistration: true,
      channelProductDisplayStatusType: input.displayStatus ?? "ON",
    },
  };
}

/** 커머스 API (v2) 상품 등록 — POST /external/v2/products */
export async function registerNaverProduct(
  input: NaverProductInput
): Promise<NaverCreateProductResult> {
  const payload = buildCreateProductPayload(input);
  return naverFetch<NaverCreateProductResult>("/v2/products", {
    method: "POST",
    json: payload,
  });
}
