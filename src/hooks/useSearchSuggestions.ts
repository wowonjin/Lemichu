"use client";

import { useEffect, useState } from "react";
import type { SearchSuggestion } from "@/lib/search/types";

export function useSearchSuggestions(query: string, usedOnly = false) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: value });
      if (usedOnly) params.set("used", "1");

      void fetch(`/api/search/suggest?${params.toString()}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { suggestions: [] }))
        .then((payload: { suggestions?: SearchSuggestion[] }) => {
          setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : []);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, usedOnly]);

  return { suggestions, loading };
}
