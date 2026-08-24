export const MAX_SEARCH_KEYWORD_LENGTH = 40;

export function normalizeSearchKeyword(raw: string) {
  const display = raw.replace(/\s+/g, " ").trim();
  if (!display || display.length > MAX_SEARCH_KEYWORD_LENGTH) return null;
  if (!/[0-9A-Za-z\uac00-\ud7a3]/.test(display)) return null;

  return {
    display,
    key: display.toLowerCase(),
  };
}

export function searchCounterDocId(key: string) {
  return key.replace(/[/.#$\[\]]/g, "_");
}

export function isSearchSource(value: unknown): value is import("./types").SearchSource {
  return (
    value === "submit" ||
    value === "suggestion" ||
    value === "popular" ||
    value === "recommended" ||
    value === "recent"
  );
}
