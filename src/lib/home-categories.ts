import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import {
  HOME_CATEGORY_COLLECTION,
  defaultHomeCategories,
  mergeHomeCategories,
  type HomeCategoryContent,
} from "@/data/homeCategories";
import { firestoreDb, isFirebaseConfigured } from "@/lib/firebase";

export type StoreHomeCategory = HomeCategoryContent & {
  createdAt?: Timestamp;
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

function toPayload(category: HomeCategoryContent) {
  return {
    label: category.label,
    href: category.href,
    hint: category.hint,
    description: category.description,
    imageSrc: category.imageSrc,
    visible: category.visible,
    order: category.order,
    items: category.items,
  };
}

async function fetchStoredHomeCategories() {
  const db = requireFirestore();
  const snapshot = await getDocs(collection(db, HOME_CATEGORY_COLLECTION));
  return snapshot.docs.map((categoryDoc) => ({
    id: categoryDoc.id,
    ...categoryDoc.data(),
  }));
}

export async function fetchHomeCategories(): Promise<HomeCategoryContent[]> {
  return mergeHomeCategories(await fetchStoredHomeCategories());
}

export async function saveHomeCategory(category: HomeCategoryContent) {
  const db = requireFirestore();
  await setDoc(
    doc(db, HOME_CATEGORY_COLLECTION, category.id),
    {
      ...toPayload(category),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function seedHomeCategories() {
  const stored = await fetchStoredHomeCategories();
  const existingIds = new Set(stored.map((item) => item.id));
  const missing =
    stored.length === 0
      ? defaultHomeCategories
      : defaultHomeCategories.filter((category) => !existingIds.has(category.id));

  if (missing.length > 0) {
    const db = requireFirestore();
    await Promise.all(
      missing.map((category) =>
        setDoc(doc(db, HOME_CATEGORY_COLLECTION, category.id), {
          ...toPayload(category),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      )
    );
  }

  return fetchHomeCategories();
}
