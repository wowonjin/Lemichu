"use client";

import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseIdToken } from "@/lib/auth";
import { firestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import {
  DEFAULT_HEADER_BANNER,
  HEADER_BANNER_CHANGE_EVENT,
  HEADER_BANNER_DISMISS_KEY,
  HEADER_BANNER_DOC_PATH,
  HEADER_BANNER_STORAGE_KEY,
  normalizeHeaderBanner,
  todayDismissKey,
  type HeaderBannerSettings,
} from "@/lib/headerBanner";

export function isHeaderBannerDismissedToday() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(HEADER_BANNER_DISMISS_KEY) === todayDismissKey();
}

export function dismissHeaderBannerForToday() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HEADER_BANNER_DISMISS_KEY, todayDismissKey());
}

function persistLocalHeaderBanner(settings: HeaderBannerSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HEADER_BANNER_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(HEADER_BANNER_CHANGE_EVENT, { detail: settings }));
}

export function readLocalHeaderBanner(): HeaderBannerSettings | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(HEADER_BANNER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return normalizeHeaderBanner(JSON.parse(raw));
  } catch {
    window.localStorage.removeItem(HEADER_BANNER_STORAGE_KEY);
    return null;
  }
}

function headerBannerRef() {
  if (!isFirebaseConfigured || !firestoreDb) return null;
  const [collectionName, documentId] = HEADER_BANNER_DOC_PATH;
  return doc(firestoreDb, collectionName, documentId);
}

export async function saveHeaderBanner(settings: HeaderBannerSettings) {
  const normalized = normalizeHeaderBanner(settings);
  persistLocalHeaderBanner(normalized);

  const ref = headerBannerRef();
  if (ref) {
    try {
      await setDoc(ref, {
        ...normalized,
        updatedAt: serverTimestamp(),
      });
      return { persisted: "firestore" as const, settings: normalized };
    } catch {
      // Firestore 규칙이 아직 반영되지 않은 경우를 위해 API로 재시도한다.
    }
  }

  try {
    const token = await getFirebaseIdToken();
    if (token) {
      const response = await fetch("/api/site/header-banner", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(normalized),
      });

      if (response.ok) {
        return { persisted: "api" as const, settings: normalized };
      }
    }
  } catch {
    // 로컬 저장으로 내려간다.
  }

  return { persisted: "local" as const, settings: normalized };
}

export function observeHeaderBanner(onChange: (settings: HeaderBannerSettings) => void) {
  if (typeof window === "undefined") {
    onChange(DEFAULT_HEADER_BANNER);
    return () => undefined;
  }

  let active = true;
  onChange(readLocalHeaderBanner() ?? DEFAULT_HEADER_BANNER);

  fetch("/api/site/header-banner")
    .then((response) => response.json())
    .then((payload: { settings?: unknown; stored?: boolean }) => {
      if (!active || !payload?.stored || !payload.settings) return;
      const settings = normalizeHeaderBanner(payload.settings);
      persistLocalHeaderBanner(settings);
      onChange(settings);
    })
    .catch(() => undefined);

  const ref = headerBannerRef();
  const unsubscribeFirestore = ref
    ? onSnapshot(
        ref,
        (snapshot) => {
          if (!snapshot.exists()) return;
          const settings = normalizeHeaderBanner(snapshot.data());
          persistLocalHeaderBanner(settings);
          onChange(settings);
        },
        () => undefined
      )
    : () => undefined;

  const handleLocalChange = (event: Event) => {
    const detail = (event as CustomEvent<HeaderBannerSettings>).detail;
    if (detail) onChange(normalizeHeaderBanner(detail));
  };

  window.addEventListener(HEADER_BANNER_CHANGE_EVENT, handleLocalChange);

  return () => {
    active = false;
    unsubscribeFirestore();
    window.removeEventListener(HEADER_BANNER_CHANGE_EVENT, handleLocalChange);
  };
}
