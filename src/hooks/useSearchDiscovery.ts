"use client";

import { useEffect, useState } from "react";
import {
  popularKeywords,
  recommendedKeywords,
  searchCategoryShortcuts,
} from "@/data/searchKeywords";
import type { SearchDiscoveryPayload } from "@/lib/search/types";

const fallbackDiscovery: SearchDiscoveryPayload = {
  recommended: recommendedKeywords,
  popular: popularKeywords.map((keyword) => ({ keyword, count: 0 })),
  popularUpdatedAt: null,
  popularSource: "fallback",
  categories: searchCategoryShortcuts,
  brands: [],
};

export function useSearchDiscovery(initial?: SearchDiscoveryPayload, enabled = true) {
  const [discovery, setDiscovery] = useState<SearchDiscoveryPayload>(initial ?? fallbackDiscovery);

  useEffect(() => {
    if (!enabled) return;

    if (initial) {
      setDiscovery(initial);
      return;
    }

    let cancelled = false;
    void fetch("/api/search/discovery")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: SearchDiscoveryPayload | null) => {
        if (!cancelled && payload?.popular && payload.recommended) {
          setDiscovery(payload);
        }
      })
      .catch(() => {
        // Keep fallback keywords if Firebase is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, initial]);

  return discovery;
}
