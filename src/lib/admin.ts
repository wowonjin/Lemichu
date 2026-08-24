import {
  collection,
  getDocs,
  type Timestamp,
} from "firebase/firestore";
import { adminRequestHeaders, assertApiOk } from "@/lib/admin-client";
import { firestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { OrderStatus, PurchaseOrder } from "@/lib/orders";
import type { StoreProduct } from "@/lib/products";

export type AdminUserProfile = {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  provider: "email" | "google" | "naver";
  role: "admin" | "member";
  photoURL?: string | null;
  points?: number;
  grade?: string;
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
  updatedAt?: Timestamp;
};

const firebaseConfigError =
  "Firestore 설정이 필요합니다. .env.local에 Firebase 값을 넣고 개발 서버를 다시 시작해주세요.";

function requireFirestore() {
  if (!isFirebaseConfigured || !firestoreDb) {
    throw new Error(firebaseConfigError);
  }

  return firestoreDb;
}

export async function fetchAdminUsers() {
  const db = requireFirestore();
  const snapshot = await getDocs(collection(db, "users"));

  return snapshot.docs
    .map((userDoc) => ({
      uid: userDoc.id,
      ...userDoc.data(),
    } as AdminUserProfile))
    .sort((a, b) => {
      const aTime = a.lastLoginAt?.toMillis() ?? 0;
      const bTime = b.lastLoginAt?.toMillis() ?? 0;
      return bTime - aTime;
    });
}

export async function fetchAdminOrders() {
  const db = requireFirestore();
  const snapshot = await getDocs(collection(db, "orders"));

  return snapshot.docs
    .map((orderDoc) => ({
      id: orderDoc.id,
      ...orderDoc.data(),
    } as PurchaseOrder))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis() ?? 0;
      const bTime = b.createdAt?.toMillis() ?? 0;
      return bTime - aTime;
    });
}

export async function fetchAdminProducts() {
  const db = requireFirestore();
  const snapshot = await getDocs(collection(db, "products"));

  return snapshot.docs
    .map((productDoc) => ({
      id: productDoc.id,
      ...productDoc.data(),
    } as StoreProduct))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis() ?? 0;
      const bTime = b.createdAt?.toMillis() ?? 0;
      return bTime - aTime;
    });
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
  delivery?: { courier?: string; invoiceNo?: string }
) {
  const json = await assertApiOk(
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: await adminRequestHeaders(),
      body: JSON.stringify({ status, delivery }),
    }),
    "주문 상태를 변경하지 못했어요."
  );
  return (typeof json.status === "string" ? json.status : status) as OrderStatus;
}
