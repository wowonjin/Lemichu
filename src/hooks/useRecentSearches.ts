"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { rememberCustomerSearch } from "@/lib/search/client";
import type { SearchSource } from "@/lib/search/types";
import {
  clearRecentSearches,
  persistRecentSearchesRemote,
  readRecentSearches,
  removeRecentSearch,
  syncRecentSearchesWithRemote,
} from "@/lib/searchHistory";

export function useRecentSearches() {
  const { user, ready } = useAuthUser();
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readRecentSearches());
  }, []);

  useEffect(() => {
    if (!ready || !user?.uid) return;

    let cancelled = false;
    void syncRecentSearchesWithRemote(user.uid)
      .then((merged) => {
        if (!cancelled) setRecent(merged);
      })
      .catch(() => {
        if (!cancelled) setRecent(readRecentSearches());
      });

    return () => {
      cancelled = true;
    };
  }, [ready, user?.uid]);

  const remember = (keyword: string, source: SearchSource = "submit", usedOnly = false) => {
    const next = rememberCustomerSearch(keyword, {
      uid: user?.uid,
      source,
      usedOnly,
    });
    setRecent(next);
    return next;
  };

  const remove = (keyword: string) => {
    const next = removeRecentSearch(keyword);
    setRecent(next);
    if (user?.uid) void persistRecentSearchesRemote(user.uid, next);
    return next;
  };

  const clear = () => {
    const next = clearRecentSearches();
    setRecent(next);
    if (user?.uid) void persistRecentSearchesRemote(user.uid, next);
    return next;
  };

  return { recent, remember, remove, clear };
}
