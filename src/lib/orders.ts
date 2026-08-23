import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from "firebase/firestore";
import { firestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { AuthUser } from "@/lib/auth";
import {
  toOrderItemSnapshot,
  type CheckoutAmounts,
  type OrderItemSnapshot,
  type ResolvedCheckoutItem,
} from "@/lib/checkout";

export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "preparing"
  | "shipping"
  | "delivered"
  | "cancelled";

export type CreateOrderInput = {
  user: AuthUser;
  items: ResolvedCheckoutItem[];
  amounts: {
    retailTotal: number;
    productTotal: number;
    instantDiscount: number;
    couponDiscount: number;
    shippingFee: number;
    finalTotal: number;
  };
};

export type OrderDeliveryInfo = {
  recipientName?: string;
  phone?: string;
  postalCode?: string;
  address1?: string;
  address2?: string;
  message?: string;
  courier?: string;
  invoiceNo?: string;
};

export type PurchaseOrder = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: OrderStatus;
  itemCount: number;
  items: OrderItemSnapshot[];
  amounts: CheckoutAmounts;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  source: "web-cart" | "web-toss";
  orderNo?: string;
  delivery?: OrderDeliveryInfo;
  payment?: {
    provider?: "toss";
    orderId?: string;
    orderName?: string;
    amount?: number;
    paymentKey?: string;
    method?: string;
    failure?: unknown;
  };
};

const firebaseConfigError =
  "Firestore 설정이 필요합니다. .env.local에 Firebase 값을 넣고 개발 서버를 다시 시작해주세요.";

function requireFirestore() {
  if (!isFirebaseConfigured || !firestoreDb) {
    throw new Error(firebaseConfigError);
  }

  return firestoreDb;
}

export async function createPurchaseOrder({ user, items, amounts }: CreateOrderInput) {
  const db = requireFirestore();

  if (!user.uid) {
    throw new Error("로그인 후 구매 기록을 저장할 수 있어요.");
  }

  if (items.length === 0) {
    throw new Error("구매할 상품을 선택해주세요.");
  }

  const itemSnapshots = items.map(toOrderItemSnapshot);

  const docRef = await addDoc(collection(db, "orders"), {
    userId: user.uid,
    userEmail: user.email,
    userName: user.name,
    status: "pending",
    itemCount: itemSnapshots.reduce<number>((sum, item) => sum + item.quantity, 0),
    items: itemSnapshots,
    amounts,
    source: "web-cart",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function fetchPurchaseOrders(userId: string, max = 20) {
  const db = requireFirestore();

  const snapshot = await getDocs(
    query(collection(db, "orders"), where("userId", "==", userId))
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as PurchaseOrder))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis() ?? 0;
      const bTime = b.createdAt?.toMillis() ?? 0;
      return bTime - aTime;
    })
    .slice(0, max);
}

export function formatOrderDate(order: Pick<PurchaseOrder, "createdAt">) {
  const date = order.createdAt?.toDate();
  if (!date) return "방금 전";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
