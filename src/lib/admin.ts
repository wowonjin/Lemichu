import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
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

export async function updateAdminOrderStatus(orderId: string, status: OrderStatus) {
  const db = requireFirestore();

  await updateDoc(doc(db, "orders", orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
}
