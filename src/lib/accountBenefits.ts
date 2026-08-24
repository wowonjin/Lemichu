/**
 * 회원 혜택(적립금·쿠폰).
 * 적립금은 Firestore users/{uid}.points 와 pointLedger 를 읽습니다.
 * 쿠폰은 users 와 별도로 userCoupons 컬렉션에서 집계합니다.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { firestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import { toSafePoints, type PointLedgerEntry } from "@/lib/points";

export type AccountBenefits = {
  points: number;
  couponCount: number;
};

export const ACCOUNT_BENEFITS_API_CONNECTED = true;

const firebaseConfigError =
  "Firestore 설정이 필요합니다. .env.local에 Firebase 값을 넣고 개발 서버를 다시 시작해주세요.";

function requireFirestore() {
  if (!isFirebaseConfigured || !firestoreDb) {
    throw new Error(firebaseConfigError);
  }

  return firestoreDb;
}

export function getAccountBenefits(): AccountBenefits {
  return { points: 0, couponCount: 0 };
}

export async function fetchAccountBenefits(userId: string): Promise<AccountBenefits> {
  const db = requireFirestore();
  const snapshot = await getDoc(doc(db, "users", userId));

  return {
    points: toSafePoints(snapshot.data()?.points),
    couponCount: 0,
  };
}

export async function fetchAccountCouponCount(userId: string) {
  const db = requireFirestore();
  try {
    const snapshot = await getDocs(query(collection(db, "userCoupons"), where("userId", "==", userId)));
    return snapshot.docs.filter((entry) => {
      const data = entry.data() as { status?: string; expiresAt?: string | null };
      if (data.status && data.status !== "available") return false;
      if (data.expiresAt && Date.parse(String(data.expiresAt)) < Date.now()) return false;
      return true;
    }).length;
  } catch {
    return 0;
  }
}

export async function fetchPointLedger(userId: string, max = 50): Promise<PointLedgerEntry[]> {
  const db = requireFirestore();

  try {
    const snapshot = await getDocs(collection(db, "users", userId, "pointLedger"));

    return snapshot.docs
      .map((entry) => {
        const data = entry.data() as Omit<PointLedgerEntry, "id"> & {
          createdAt?: Timestamp;
        };
        return {
          id: entry.id,
          ...data,
        } as PointLedgerEntry;
      })
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis() ?? 0;
        const bTime = b.createdAt?.toMillis() ?? 0;
        return bTime - aTime;
      })
      .slice(0, max);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      String(error.code) === "permission-denied"
    ) {
      return [];
    }
    throw error;
  }
}
