import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { firestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { DeliveryBadge } from "@/types/product";
import type { Product } from "@/types/product";

export const WISHLIST_CHANGE = "lemichu-wishlist-change";
const STORAGE_PREFIX = "lemichu.wishlist.";

export type WishlistAlertPrefs = {
  priceChange: boolean;
  restock: boolean;
  todayShip: boolean;
  targetPrice: number | null;
};

export type WishlistRecord = {
  productId: string;
  addedAt: number;
  priceAtAdd: number;
  deliveryBadgeAtAdd?: DeliveryBadge;
  alerts: WishlistAlertPrefs;
};

export const DEFAULT_WISHLIST_ALERTS: WishlistAlertPrefs = {
  priceChange: false,
  restock: false,
  todayShip: false,
  targetPrice: null,
};

/**
 * 푸시 알림 서버는 아직 없습니다.
 * 알림 토글은 위시리스트 레코드의 로컬/Firestore 선호도로만 저장합니다.
 */
export const PRICE_ALERT_PUSH_CONNECTED = false;

const LOCAL_FALLBACK_ERROR_CODES = new Set([
  "permission-denied",
  "unauthenticated",
  "unavailable",
]);

function shouldUseLocalFallback(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  return LOCAL_FALLBACK_ERROR_CODES.has(String(error.code));
}

function storageKey(ownerId: string) {
  return `${STORAGE_PREFIX}${ownerId}`;
}

function isRecord(value: unknown): value is WishlistRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as WishlistRecord;
  return typeof record.productId === "string" && typeof record.addedAt === "number";
}

function normalizeRecord(value: unknown): WishlistRecord | null {
  if (!isRecord(value)) return null;
  return {
    productId: value.productId,
    addedAt: value.addedAt,
    priceAtAdd: typeof value.priceAtAdd === "number" ? value.priceAtAdd : 0,
    deliveryBadgeAtAdd: value.deliveryBadgeAtAdd,
    alerts: {
      priceChange: Boolean(value.alerts?.priceChange),
      restock: Boolean(value.alerts?.restock),
      todayShip: Boolean(value.alerts?.todayShip),
      targetPrice:
        typeof value.alerts?.targetPrice === "number" ? value.alerts.targetPrice : null,
    },
  };
}

export function guestWishlistOwnerId() {
  return "guest";
}

export function wishlistOwnerId(userId?: string | null) {
  return userId || guestWishlistOwnerId();
}

export function readWishlistRecords(ownerId: string): WishlistRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(storageKey(ownerId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeRecord)
      .filter((item): item is WishlistRecord => Boolean(item))
      .sort((a, b) => b.addedAt - a.addedAt);
  } catch {
    return [];
  }
}

export function writeWishlistRecords(ownerId: string, records: WishlistRecord[]) {
  if (typeof window === "undefined") return;

  const next = records
    .map(normalizeRecord)
    .filter((item): item is WishlistRecord => Boolean(item))
    .sort((a, b) => b.addedAt - a.addedAt);

  window.localStorage.setItem(storageKey(ownerId), JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent(WISHLIST_CHANGE, { detail: { ownerId, records: next } })
  );
}

export function createWishlistRecord(product: Product, alerts = DEFAULT_WISHLIST_ALERTS): WishlistRecord {
  return {
    productId: product.id,
    addedAt: Date.now(),
    priceAtAdd: product.price,
    deliveryBadgeAtAdd: product.deliveryBadge,
    alerts,
  };
}

export function mergeWishlistRecords(primary: WishlistRecord[], extra: WishlistRecord[]) {
  const byId = new Map<string, WishlistRecord>();
  for (const record of [...primary, ...extra]) {
    const current = byId.get(record.productId);
    if (!current || record.addedAt > current.addedAt) {
      byId.set(record.productId, record);
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.addedAt - a.addedAt);
}

export async function fetchRemoteWishlist(userId: string): Promise<WishlistRecord[]> {
  const db = getFirestoreDb();
  if (!db) return [];

  try {
    const snapshot = await getDocs(collection(db, "users", userId, "wishlist"));
    return snapshot.docs
      .map((item) => normalizeRecord({ productId: item.id, ...item.data() }))
      .filter((item): item is WishlistRecord => Boolean(item))
      .sort((a, b) => b.addedAt - a.addedAt);
  } catch (error) {
    if (shouldUseLocalFallback(error)) return [];
    throw error;
  }
}

function getFirestoreDb() {
  if (!isFirebaseConfigured || !firestoreDb) return null;
  return firestoreDb;
}

export async function persistWishlistRecord(userId: string, record: WishlistRecord) {
  writeWishlistRecords(
    userId,
    mergeWishlistRecords(readWishlistRecords(userId), [record])
  );

  if (userId === guestWishlistOwnerId()) return;

  const db = getFirestoreDb();
  if (!db) return;

  try {
    await setDoc(doc(db, "users", userId, "wishlist", record.productId), record);
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
  }
}

export async function deleteWishlistRecord(userId: string, productId: string) {
  writeWishlistRecords(
    userId,
    readWishlistRecords(userId).filter((item) => item.productId !== productId)
  );

  if (userId === guestWishlistOwnerId()) return;

  const db = getFirestoreDb();
  if (!db) return;

  try {
    await deleteDoc(doc(db, "users", userId, "wishlist", productId));
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
  }
}

export async function persistWishlistRecords(userId: string, records: WishlistRecord[]) {
  writeWishlistRecords(userId, records);

  if (userId === guestWishlistOwnerId()) return;

  const db = getFirestoreDb();
  if (!db) return;

  try {
    await Promise.all(
      records.map((record) =>
        setDoc(doc(db, "users", userId, "wishlist", record.productId), record)
      )
    );
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
  }
}

export function clearGuestWishlist() {
  writeWishlistRecords(guestWishlistOwnerId(), []);
}

export function getWishlistInsight(
  product: Product,
  record?: WishlistRecord | null
): { kind: "price-drop" | "today-ship" | "low-stock"; label: string } | null {
  if (record && record.priceAtAdd > product.price) {
    const drop = record.priceAtAdd - product.price;
    return {
      kind: "price-drop",
      label: `찜한 뒤 ${new Intl.NumberFormat("ko-KR").format(drop)}원 내려갔어요`,
    };
  }

  if (
    product.deliveryBadge === "오늘출고" &&
    record?.deliveryBadgeAtAdd &&
    record.deliveryBadgeAtAdd !== "오늘출고"
  ) {
    return { kind: "today-ship", label: "오늘 주문하면 당일 출고" };
  }

  if (product.deliveryBadge === "오늘출고") {
    return { kind: "today-ship", label: "오늘 주문하면 당일 출고" };
  }

  if (product.stockQuantity === 1) {
    return { kind: "low-stock", label: "재고 1개" };
  }

  return null;
}

export function getProductAvailability(product: Product) {
  return product.availability ?? "available";
}
