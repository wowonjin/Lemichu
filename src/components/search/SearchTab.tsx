"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SearchDiscovery } from "@/components/search/SearchDiscovery";
import {
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
  removeRecentSearch,
} from "@/lib/searchHistory";
import type { Product } from "@/types/product";

export function SearchTab({
  initialQuery = "",
  results,
  hasQuery,
}: {
  initialQuery?: string;
  results: Product[];
  hasQuery: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setRecent(readRecentSearches());
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    if (value) setRecent(addRecentSearch(value));
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  return (
    <section className="min-h-[calc(100vh-160px)] bg-background">
      <div className="container py-8 md:py-10">
        <form onSubmit={submit} className="relative mx-auto max-w-3xl">
          <Search className="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="브랜드, 상품명으로 검색"
            aria-label="상품 검색"
            autoFocus
            className="h-12 w-full border-b border-border bg-transparent py-3 pl-9 pr-24 text-[15px] outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
          />
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {query ? (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => setQuery("")}
                className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" strokeWidth={1.8} />
              </button>
            ) : null}
            <button
              type="submit"
              className="px-1 text-sm font-semibold text-foreground transition-colors hover:text-gold"
            >
              검색
            </button>
          </div>
        </form>

        <div className="mx-auto mt-10 max-w-3xl">
          {hasQuery ? (
            <section>
              <h2 className="text-base font-semibold text-foreground">
                ‘{initialQuery}’ 검색 결과
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">총 {results.length}개 상품</p>
              <div className="mt-6">
                {results.length > 0 ? (
                  <ProductGrid
                    products={results}
                    cardClassName="[&_span]:rounded-none"
                    imageClassName="rounded-none border-transparent bg-transparent"
                    hideAuthenticationBadge
                    hiddenBadges={["희소상품"]}
                  />
                ) : (
                  <div className="grid min-h-40 place-items-center border border-dashed border-border text-sm text-muted-foreground">
                    검색 결과가 없습니다.
                  </div>
                )}
              </div>
            </section>
          ) : (
            <SearchDiscovery
              recent={recent}
              onSelect={(keyword) => setRecent(addRecentSearch(keyword))}
              onRemoveRecent={(keyword) => setRecent(removeRecentSearch(keyword))}
              onClearRecent={() => setRecent(clearRecentSearches())}
            />
          )}
        </div>
      </div>
    </section>
  );
}
