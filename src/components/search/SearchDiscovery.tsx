import Link from "next/link";
import { X } from "lucide-react";
import { formatPopularUpdatedAt } from "@/data/searchKeywords";
import { cn } from "@/lib/cn";
import { buildSearchHref } from "@/lib/search/url";
import type { SearchCategoryShortcut, SearchSource } from "@/lib/search/types";

export function SearchDiscovery({
  recent,
  recommended,
  popular,
  popularUpdatedAt,
  categories,
  onSelect,
  onClose,
  onRemoveRecent,
  onClearRecent,
  showCategories = false,
  usedOnly = false,
  popularLimit = 10,
}: {
  recent: string[];
  recommended: string[];
  popular: Array<{ keyword: string; count?: number } | string>;
  popularUpdatedAt?: string | null;
  categories?: SearchCategoryShortcut[];
  onSelect: (keyword: string, source: SearchSource) => void;
  onClose?: () => void;
  onRemoveRecent: (keyword: string) => void;
  onClearRecent: () => void;
  showCategories?: boolean;
  usedOnly?: boolean;
  popularLimit?: number;
}) {
  const ranking = popular.slice(0, popularLimit).map((item) =>
    typeof item === "string" ? item : item.keyword
  );
  const keywordHref = (keyword: string) => buildSearchHref(keyword, { used: usedOnly });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
      <div className="space-y-7">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">최근 검색어</h3>
            {recent.length > 0 ? (
              <button
                type="button"
                onClick={onClearRecent}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                모두 삭제
              </button>
            ) : null}
          </div>
          {recent.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {recent.map((keyword) => (
                <li key={keyword}>
                  <span className="inline-flex items-center rounded-md bg-secondary pl-3 text-sm text-foreground">
                    <Link
                      href={keywordHref(keyword)}
                      onClick={() => onSelect(keyword, "recent")}
                      className="py-1.5 pr-1"
                    >
                      {keyword}
                    </Link>
                    <button
                      type="button"
                      aria-label={`${keyword} 삭제`}
                      onClick={() => onRemoveRecent(keyword)}
                      className="grid size-8 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="size-3.5" strokeWidth={2} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">최근 검색어가 없습니다.</p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-foreground">추천 검색어</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {recommended.map((keyword) => (
              <li key={keyword}>
                <Link
                  href={keywordHref(keyword)}
                  onClick={() => onSelect(keyword, "recommended")}
                  className="inline-flex rounded-md bg-foreground px-3.5 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
                >
                  {keyword}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {showCategories && categories && categories.length > 0 ? (
          <section>
            <h3 className="text-sm font-semibold text-foreground">카테고리</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {categories.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="inline-flex rounded-md border border-border px-3.5 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <section>
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">인기 검색어</h3>
          <span className="text-[11px] text-muted-foreground">
            {formatPopularUpdatedAt(popularUpdatedAt)}
          </span>
        </div>
        <ol className="mt-3 divide-y divide-border/70">
          {ranking.map((keyword, index) => (
            <li key={keyword}>
              <Link
                href={keywordHref(keyword)}
                onClick={() => onSelect(keyword, "popular")}
                className="flex items-center gap-3 py-2.5 text-sm transition-colors hover:text-gold"
              >
                <span
                  className={cn(
                    "w-5 shrink-0 text-xs font-semibold tabular-nums",
                    index < 3 ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {index + 1}
                </span>
                <span className="truncate text-foreground">{keyword}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
