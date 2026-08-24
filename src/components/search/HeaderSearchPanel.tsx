"use client";

import { type FormEvent, type RefObject } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { SearchDiscovery } from "./SearchDiscovery";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useSearchDiscovery } from "@/hooks/useSearchDiscovery";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useUsedCatalogMode } from "@/hooks/useUsedCatalogMode";
import { cn } from "@/lib/cn";
import type { SearchSource } from "@/lib/search/types";

export function HeaderSearchPanel({
  isOpen,
  query,
  inputRef,
  onQueryChange,
  onSubmit,
  onClose,
}: {
  isOpen: boolean;
  query: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const { usedOnly } = useUsedCatalogMode();
  const { recent, remember, remove, clear } = useRecentSearches();
  const discovery = useSearchDiscovery(undefined, isOpen);
  const { suggestions, loading: suggestionsLoading } = useSearchSuggestions(isOpen ? query : "", usedOnly);
  const normalizedQuery = query.trim().toLowerCase();

  const rememberAndClose = (keyword?: string, source: SearchSource = "suggestion") => {
    if (keyword) remember(keyword, source, usedOnly);
    onClose();
  };

  return (
    <div
      id="header-search-panel"
      role="dialog"
      aria-modal="true"
      aria-label="검색"
      aria-hidden={!isOpen}
      inert={!isOpen ? true : undefined}
      className={cn(
        "absolute inset-x-0 top-full z-10 grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isOpen ? "pointer-events-auto grid-rows-[1fr]" : "pointer-events-none grid-rows-[0fr]"
      )}
    >
      <div className="overflow-hidden">
        <div className="border-b border-border bg-background shadow-xl">
          <div className="container max-h-[min(72vh,calc(100dvh-8.5rem))] overflow-y-auto overscroll-contain pb-8 pt-5">
            <form
              onSubmit={onSubmit}
              className={cn(
                "relative transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              )}
            >
              <Search className="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="브랜드, 상품명으로 검색"
                aria-label="상품 검색"
                className="h-12 w-full border-b border-border bg-transparent py-3 pl-9 pr-24 text-[15px] outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
              />
              <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {query ? (
                  <button
                    type="button"
                    aria-label="검색어 지우기"
                    onClick={() => {
                      onQueryChange("");
                      inputRef.current?.focus();
                    }}
                    className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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

            <div
              className={cn(
                "mt-7 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                isOpen ? "translate-y-0 opacity-100 delay-75" : "translate-y-2 opacity-0"
              )}
            >
              {normalizedQuery ? (
                <section>
                  <h3 className="text-sm font-semibold text-foreground">자동완성</h3>
                  {suggestionsLoading ? (
                    <p className="mt-3 text-sm text-muted-foreground">상품을 찾고 있습니다...</p>
                  ) : suggestions.length > 0 ? (
                    <ul className="mt-2 divide-y divide-border/70">
                      {suggestions.map((item) => (
                        <li key={`${item.href}-${item.label}`}>
                          <Link
                            href={item.href}
                            onClick={() => rememberAndClose(item.label, "suggestion")}
                            className="flex items-center gap-3 py-3 text-sm text-foreground transition-colors hover:text-gold"
                          >
                            <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      일치하는 브랜드나 상품이 없습니다. 엔터로 검색해 보세요.
                    </p>
                  )}
                </section>
              ) : (
                <SearchDiscovery
                  recent={recent}
                  recommended={discovery.recommended}
                  popular={discovery.popular}
                  popularUpdatedAt={discovery.popularUpdatedAt}
                  categories={discovery.categories}
                  showCategories
                  usedOnly={usedOnly}
                  onSelect={rememberAndClose}
                  onClose={onClose}
                  onRemoveRecent={remove}
                  onClearRecent={clear}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
