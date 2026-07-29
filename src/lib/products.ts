import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { allProducts } from "@/data/mockProducts";
import { firestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { NaverProductInput } from "@/lib/naver/types";
import type { ProductImageAsset } from "@/lib/product-images";

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
  size?: string;
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

const seededStoreProducts: StoreProduct[] = allProducts.map((product, index) => ({
  id: product.id,
  name: product.name,
  brand: product.brand,
  size: product.size,
  salePrice: product.price,
  retailPrice: product.retailPrice,
  stockQuantity: 2 + (index % 4),
  representativeImageUrl: product.imageUrl,
  optionalImageUrls: [],
  optionalImages: [],
  detailContent: `<p>${product.brand} ${product.name}은(는) LEMICHU 검수 기준에 맞춰 등록된 시드 상품입니다.</p>`,
  leafCategoryId: "50000837",
  originAreaCode: "0200037",
  deliveryFee: product.deliveryBadge === "해외배송" ? 30000 : 0,
  afterServiceTelephoneNumber: "1600-0000",
  afterServiceGuideContent: "평일 10:00~18:00 고객센터 운영",
  naverSync: { status: "skipped" },
}));

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
    optionalImageUrls: input.optionalImageUrls ?? [],
    optionalImages: input.optionalImages ?? [],
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
    return seededStoreProducts;
  }

  const db = firestoreDb;
  const snapshot = await getDocs(collection(db, "products"));

  const storedProducts = snapshot.docs
    .map((productDoc) => ({ id: productDoc.id, ...productDoc.data() } as StoreProduct))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis() ?? 0;
      const bTime = b.createdAt?.toMillis() ?? 0;
      return bTime - aTime;
    });

  return [...storedProducts, ...seededStoreProducts];
}
