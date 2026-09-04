import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from "firebase/firestore";
import { toDateValue } from "@/lib/admin-serialize";
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

export type PaymentMethod = "BANK_TRANSFER" | "TOSS_CARD" | "TOSS_TRANSFER" | "POINTS";

export type PaymentStatus =
  | "WAITING_FOR_DEPOSIT"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED";

export type OrderTimestamp = Timestamp | string;

export type CreateOrderInput = {
  user: AuthUser;
  items: ResolvedCheckoutItem[];
  amounts: {
    retailTotal: number;
    productTotal: number;
    instantDiscount: number;
    couponDiscount: number;
    shippingFee: number;
    pointsUsed?: number;
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
  logii?: {
    reservationNo?: string;
    bookedAt?: string;
    service?: string;
    parcelSize?: string;
    itemName?: string;
    recipientName?: string;
    recipientPhone?: string;
    recipientAddress?: string;
    sourceFileName?: string;
  };
};

export type PurchaseOrder = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  isGuest?: boolean;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  expectedAmount?: number;
  depositorName?: string;
  depositorNameNormalized?: string;
  depositDueAt?: OrderTimestamp;
  paidAt?: OrderTimestamp;
  paymentReference?: string;
  itemCount: number;
  items: OrderItemSnapshot[];
  amounts: CheckoutAmounts;
  createdAt?: OrderTimestamp;
  updatedAt?: OrderTimestamp;
  source:
    | "web-cart"
    | "web-toss"
    | "web-bank-transfer"
    | "web-guest-bank-transfer"
    | "logii";
  orderNo?: string;
  delivery?: OrderDeliveryInfo;
  payment?: {
    provider?: "toss" | "bank-transfer" | "points";
    orderId?: string;
    orderName?: string;
    amount?: number;
    paymentKey?: string;
    method?: string;
    requestedMethod?: string;
    bank?: string;
    requestedAt?: OrderTimestamp;
    approvedAt?: OrderTimestamp;
    failedAt?: OrderTimestamp;
    toss?: unknown;
    failure?: unknown;
  };
  agreements?: {
    termsAcceptedAt?: OrderTimestamp;
    privacyAcceptedAt?: OrderTimestamp;
    purchaseConfirmedAt?: OrderTimestamp;
  };
  inventory?: {
    processed?: boolean;
    processedAt?: OrderTimestamp;
    restored?: boolean;
    restoredAt?: OrderTimestamp;
    paymentReference?: string;
  };
  reward?: {
    points: number;
    rate: number;
    granted: boolean;
    reversed?: boolean;
    method?: string;
  };
  points?: {
    spent?: boolean;
    restored?: boolean;
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
      const aTime = toDateValue(a.createdAt)?.getTime() ?? 0;
      const bTime = toDateValue(b.createdAt)?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, max);
}

export function formatOrderDate(order: Pick<PurchaseOrder, "createdAt">) {
  const date = toDateValue(order.createdAt);
  if (!date) return "방금 전";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
