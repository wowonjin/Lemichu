import {
  collection,
  getDocs,
  type Timestamp,
} from "firebase/firestore";
import { adminRequestHeaders, assertApiOk } from "@/lib/admin-client";
import { firestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { NaverProductInput } from "@/lib/naver/types";
import type { ProductImageAsset } from "@/lib/product-images";
import type { ConditionGrade, ProductAvailability, ProductVariant } from "@/types/product";

export type NaverSyncStatus = "synced" | "failed" | "skipped";

export type NaverSyncInfo = {
  status: NaverSyncStatus;
  originProductNo?: number;
  channelProductNo?: number;
  error?: string;
  syncedAt?: string;
};

/**
 * 우리 쇼핑몰에 저장되는 상품 문서.
 * 카탈로그 표시 필드 + 커머스(네이버 등록) 필드 + 네이버 연동 상태를 함께 보관합니다.
 */
export type StoreProduct = {
  id: string;
  name: string;
  brand: string;
  color?: string;
  size?: string;
  variants?: ProductVariant[];
  salePrice: number;
  retailPrice?: number;
  stockQuantity: number;
  representativeImageUrl: string;
  optionalImageUrls?: string[];
  representativeImage?: ProductImageAsset;
  optionalImages?: ProductImageAsset[];
  detailContent: string;
  leafCategoryId: string;
  originAreaCode: string;
  deliveryFee: number;
  afterServiceTelephoneNumber: string;
  afterServiceGuideContent: string;
  storeCategoryId?: string;
  isPreOwned?: boolean;
  condition?: ConditionGrade;
  todayShip?: boolean;
  overseasShipping?: boolean;
  availability?: ProductAvailability;
  naverSync: NaverSyncInfo;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type CreateStoreProductInput = Omit<
  StoreProduct,
  "id" | "naverSync" | "createdAt" | "updatedAt"
>;

export type UpdateStoreProductInput = Partial<
  Pick<
    CreateStoreProductInput,
    | "name"
    | "brand"
    | "color"
    | "size"
    | "salePrice"
    | "stockQuantity"
    | "storeCategoryId"
    | "isPreOwned"
    | "condition"
    | "todayShip"
    | "detailContent"
    | "representativeImageUrl"
    | "optionalImageUrls"
    | "representativeImage"
    | "optionalImages"
  >
> & { retailPrice?: number | null };

/** 폼 입력값을 네이버 등록 API 입력 모델로 변환합니다. */
export function toNaverProductInput(input: CreateStoreProductInput): NaverProductInput {
  return {
    name: input.name,
    leafCategoryId: input.leafCategoryId,
    salePrice: input.salePrice,
    stockQuantity: input.stockQuantity,
    representativeImageUrl: input.representativeImageUrl,
    optionalImageUrls: input.optionalImageUrls,
    detailContent: input.detailContent,
    deliveryFee: input.deliveryFee,
    originAreaCode: input.originAreaCode,
    afterServiceTelephoneNumber: input.afterServiceTelephoneNumber,
    afterServiceGuideContent: input.afterServiceGuideContent,
    brandName: input.brand || undefined,
    manufacturerName: input.brand || undefined,
  };
}

/** 우리 쇼핑몰 Firestore products 컬렉션에 상품을 저장합니다. */
export async function createStoreProduct(
  input: CreateStoreProductInput,
  naverSync: NaverSyncInfo
): Promise<string> {
  const json = await assertApiOk(
    await fetch("/api/admin/products", {
      method: "POST",
      headers: await adminRequestHeaders(),
      body: JSON.stringify({ ...input, naverSync }),
    }),
    "상품을 저장하지 못했어요."
  );
  return String(json.id ?? "");
}

export async function updateStoreProduct(id: string, input: UpdateStoreProductInput) {
  await assertApiOk(
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: await adminRequestHeaders(),
      body: JSON.stringify(input),
    }),
    "상품 정보를 저장하지 못했어요."
  );
}

/** 저장된 상품 목록을 최신순으로 조회합니다. */
export async function fetchStoreProducts(): Promise<StoreProduct[]> {
  if (!isFirebaseConfigured || !firestoreDb) {
    return [];
  }

  const db = firestoreDb;
  const snapshot = await getDocs(collection(db, "products"));

  return snapshot.docs
    .map((productDoc) => ({ id: productDoc.id, ...productDoc.data() } as StoreProduct))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis() ?? 0;
      const bTime = b.createdAt?.toMillis() ?? 0;
      return bTime - aTime;
    });
}

export async function deleteStoreProduct(product: StoreProduct) {
  await assertApiOk(
    await fetch(`/api/admin/products/${product.id}`, {
      method: "DELETE",
      headers: await adminRequestHeaders(),
    }),
    "상품을 삭제하지 못했어요."
  );
}
