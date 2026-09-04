import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestoreDb, isFirebaseConfigured } from "@/lib/firebase";

const STORAGE_KEY = "lemichu.recentSearches";
const MAX_RECENT = 8;

const LOCAL_FALLBACK_ERROR_CODES = new Set([
  "permission-denied",
  "unauthenticated",
  "unavailable",
]);

function sanitize(keywords: unknown): string[] {
  if (!Array.isArray(keywords)) return [];

  const seen = new Set<string>();
  const sanitized: string[] = [];

  for (const item of keywords) {
    if (typeof item !== "string") continue;

    const keyword = item.trim();
    if (!keyword) continue;

    const normalized = keyword.toLocaleLowerCase("ko-KR");
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    sanitized.push(keyword);
    if (sanitized.length >= MAX_RECENT) break;
  }

  return sanitized;
}

function mergeKeywords(primary: string[], secondary: string[]) {
  return sanitize([...primary, ...secondary]);
}

function shouldUseLocalFallback(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  return LOCAL_FALLBACK_ERROR_CODES.has(String(error.code));
}

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];

  try {
    return sanitize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

function writeRecentSearches(keywords: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(keywords)));
}

export function addRecentSearch(keyword: string): string[] {
  const value = keyword.trim();
  if (!value) return readRecentSearches();

  const next = [value, ...readRecentSearches().filter((item) => item !== value)];
  writeRecentSearches(next);
  return sanitize(next);
}

export function removeRecentSearch(keyword: string): string[] {
  const next = readRecentSearches().filter((item) => item !== keyword);
  writeRecentSearches(next);
  return next;
}

export function clearRecentSearches(): string[] {
  writeRecentSearches([]);
  return [];
}

export async function persistRecentSearchesRemote(userId: string, keywords: string[]) {
  if (!isFirebaseConfigured || !firestoreDb || !userId) return;

  try {
    await setDoc(
      doc(firestoreDb, "users", userId),
      {
        recentSearches: sanitize(keywords),
        recentSearchesUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
  }
}

export async function syncRecentSearchesWithRemote(userId: string): Promise<string[]> {
  const local = readRecentSearches();
  if (!isFirebaseConfigured || !firestoreDb || !userId) return local;

  try {
    const snapshot = await getDoc(doc(firestoreDb, "users", userId));
    const remote = sanitize(snapshot.data()?.recentSearches);
    const merged = mergeKeywords(local, remote);
    writeRecentSearches(merged);
    if (merged.join("\0") !== remote.join("\0")) {
      await persistRecentSearchesRemote(userId, merged);
    }
    return merged;
  } catch (error) {
    if (shouldUseLocalFallback(error)) return local;
    throw error;
  }
}
