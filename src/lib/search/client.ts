import { getFirebaseIdToken } from "@/lib/auth";
import { addRecentSearch, persistRecentSearchesRemote } from "@/lib/searchHistory";
import type { SearchSource } from "@/lib/search/types";

export function rememberCustomerSearch(
  keyword: string,
  options?: { uid?: string; source?: SearchSource; usedOnly?: boolean }
) {
  const recent = addRecentSearch(keyword);
  if (options?.uid) void persistRecentSearchesRemote(options.uid, recent);
  recordCustomerSearch(keyword, {
    source: options?.source ?? "submit",
    usedOnly: options?.usedOnly,
  });
  return recent;
}

export function recordCustomerSearch(
  keyword: string,
  options?: { source?: SearchSource; usedOnly?: boolean }
) {
  const value = keyword.trim();
  if (!value) return;

  void (async () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = await getFirebaseIdToken().catch(() => null);
    if (token) headers.Authorization = `Bearer ${token}`;

    await fetch("/api/search/record", {
      method: "POST",
      headers,
      body: JSON.stringify({
        keyword: value,
        source: options?.source ?? "submit",
        usedOnly: Boolean(options?.usedOnly),
      }),
    });
  })().catch(() => {
    // Search ranking should not block the customer flow.
  });
}
