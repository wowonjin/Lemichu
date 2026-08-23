import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { firestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { NaverProductInput } from "@/lib/naver/types";
import type { ProductImageAsset } from "@/lib/product-images";
import type { ProductVariant } from "@/types/product";

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
  todayShip?: boolean;
  overseasShipping?: boolean;
  naverSync: NaverSyncInfo;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type CreateStoreProductInput = Omit<
  StoreProduct,
  "id" | "naverSync" | "createdAt" | "updatedAt"
>;

const firebaseConfigError =
  "Firestore 설정이 필요합니다. .env.local에 Firebase 값을 넣고 개발 서버를 다시 시작해주세요.";

function requireFirestore() {
  if (!isFirebaseConfigured || !firestoreDb) {
    throw new Error(firebaseConfigError);
  }
  return firestoreDb;
}

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
  const db = requireFirestore();
  const { size, ...productInput } = input;

  const docRef = await addDoc(collection(db, "products"), {
    ...productInput,
    ...(size ? { size } : {}),
    ...(input.storeCategoryId ? { storeCategoryId: input.storeCategoryId } : {}),
    isPreOwned: Boolean(input.isPreOwned),
    todayShip: Boolean(input.todayShip),
    overseasShipping: Boolean(input.overseasShipping),
    optionalImageUrls: input.optionalImageUrls ?? [],
    optionalImages: input.optionalImages ?? [],
    variants: input.variants ?? [],
    retailPrice: input.retailPrice ?? null,
    naverSync,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
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
  const db = requireFirestore();
  await deleteDoc(doc(db, "products", product.id));
}
