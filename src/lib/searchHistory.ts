const STORAGE_KEY = "lemichu.recentSearches";
const MAX_RECENT = 8;

function sanitize(keywords: unknown): string[] {
  if (!Array.isArray(keywords)) return [];
  return keywords
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_RECENT);
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
