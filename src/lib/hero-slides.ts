import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { heroSlides as defaultHeroSlides, type HeroSlide } from "@/data/campaigns";
import { firestoreDb, isFirebaseConfigured } from "@/lib/firebase";

export type StoreHeroSlide = HeroSlide & {
  visible: boolean;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type HeroSlideInput = Omit<StoreHeroSlide, "id" | "createdAt" | "updatedAt">;

const collectionName = "heroSlides";

const firebaseConfigError =
  "Firestore 설정이 필요합니다. .env.local에 Firebase 값을 넣고 개발 서버를 다시 시작해주세요.";

function requireFirestore() {
  if (!isFirebaseConfigured || !firestoreDb) {
    throw new Error(firebaseConfigError);
  }
  return firestoreDb;
}

export function defaultStoreHeroSlides(): StoreHeroSlide[] {
  return defaultHeroSlides.map((slide, index) => ({
    ...slide,
    dark: Boolean(slide.dark),
    visible: true,
    order: index,
  }));
}

export function toHeroSlide(slide: StoreHeroSlide): HeroSlide {
  return {
    id: slide.id,
    eyebrow: slide.eyebrow,
    title: slide.title,
    subtitle: slide.subtitle,
    ctaLabel: slide.ctaLabel,
    ctaHref: slide.ctaHref,
    image: slide.image,
    dark: slide.dark,
  };
}

function sortSlides(slides: StoreHeroSlide[]) {
  return [...slides].sort((a, b) => a.order - b.order);
}

export async function fetchHeroSlides(): Promise<StoreHeroSlide[]> {
  const db = requireFirestore();
  const snapshot = await getDocs(collection(db, collectionName));

  return sortSlides(
    snapshot.docs.map((slideDoc) => {
      const data = slideDoc.data();
      return {
        id: slideDoc.id,
        eyebrow: String(data.eyebrow ?? ""),
        title: String(data.title ?? ""),
        subtitle: String(data.subtitle ?? ""),
        ctaLabel: String(data.ctaLabel ?? ""),
        ctaHref: String(data.ctaHref ?? "/"),
        image: String(data.image ?? ""),
        dark: Boolean(data.dark),
        visible: data.visible !== false,
        order: typeof data.order === "number" ? data.order : 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    })
  );
}

export async function createHeroSlide(input: HeroSlideInput): Promise<string> {
  const db = requireFirestore();
  const docRef = await addDoc(collection(db, collectionName), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateHeroSlide(id: string, input: Partial<HeroSlideInput>) {
  const db = requireFirestore();
  await updateDoc(doc(db, collectionName, id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteHeroSlide(id: string) {
  const db = requireFirestore();
  await deleteDoc(doc(db, collectionName, id));
}

export async function reorderHeroSlides(ids: string[]) {
  const db = requireFirestore();
  const batch = writeBatch(db);
  ids.forEach((id, order) => {
    batch.update(doc(db, collectionName, id), {
      order,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function seedHeroSlides() {
  const existing = await fetchHeroSlides();
  if (existing.length > 0) return existing;

  const seeded = defaultStoreHeroSlides();
  for (const slide of seeded) {
    await createHeroSlide({
      eyebrow: slide.eyebrow,
      title: slide.title,
      subtitle: slide.subtitle,
      ctaLabel: slide.ctaLabel,
      ctaHref: slide.ctaHref,
      image: slide.image,
      dark: slide.dark,
      visible: slide.visible,
      order: slide.order,
    });
  }
  return fetchHeroSlides();
}
