export function buildSearchHref(query: string, options?: { used?: boolean }) {
  const params = new URLSearchParams();
  const value = query.trim();
  if (value) params.set("q", value);
  if (options?.used) params.set("used", "1");
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function toggleSearchUsedHref(search: string, used: boolean) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (used) params.set("used", "1");
  else params.delete("used");
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
