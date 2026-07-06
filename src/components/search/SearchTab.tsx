"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/types/product";

const recentKeywords = ["롤드라운"];

const recommendedKeywords = [
  "특가데이",
  "가방",
  "루이비통",
  "톰브라운",
  "중고루이비통",
  "프라다",
  "지갑",
  "중고샤넬",
  "중고셀린느",
  "중고프라다",
];

const popularKeywords = [
  "루이비통",
  "샤넬",
  "Supreme",
  "프라다",
  "셀린느",
  "구찌",
  "버버리",
  "보테가베네타",
  "에르메스",
  "IAB",
  "더로우",
  "디올",
  "미우미우",
  "발렌시아가",
  "생로랑",
  "메종마르지엘라",
  "BAPE",
  "반클리프앤아펠",
  "고야드",
  "코스",
];

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

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  return (
    <section className="min-h-[calc(100vh-160px)] bg-white font-sans">
      <div className="border-b border-border">
        <div className="container flex h-16 items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="LEMICHU 홈">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="LEMICHU" className="h-5 w-auto md:h-6" />
            </Link>
            <div className="hidden items-center gap-1 bg-secondary p-1 text-xs font-semibold md:flex">
              <span className="bg-foreground px-3 py-1.5 text-background">전체</span>
              <span className="px-3 py-1.5 text-muted-foreground">중고</span>
            </div>
          </div>

          <form onSubmit={submit} className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="상품과 브랜드를 검색해보세요."
              aria-label="상품 검색"
              autoFocus
              className="h-11 w-full border border-border bg-white pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground"
            />
          </form>

          <Link
            href="/"
            aria-label="검색 닫기"
            className="grid size-10 shrink-0 place-items-center text-foreground transition-colors hover:text-muted-foreground"
          >
            <X className="size-6" strokeWidth={1.8} />
          </Link>
        </div>
      </div>

      <div className="container grid gap-12 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden border-y border-border py-5 lg:block">
          <h2 className="text-sm font-semibold text-foreground">검색 메뉴</h2>
          <div className="mt-4 divide-y divide-border">
            {["최근 검색어", "추천 검색어", "인기 검색어"].map((item) => (
              <a
                key={item}
                href={`#${item}`}
                className="block py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item}
              </a>
            ))}
          </div>
        </aside>

        <div className="mx-auto w-full max-w-3xl space-y-12">
          <section id="최근 검색어">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">최근 검색어</h2>
              <button
                type="button"
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                모두 삭제
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {recentKeywords.map((keyword) => (
                <Link
                  key={keyword}
                  href={`/search?q=${encodeURIComponent(keyword)}`}
                  className="inline-flex items-center gap-1 bg-secondary px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-border"
                >
                  {keyword}
                  <span className="text-muted-foreground">×</span>
                </Link>
              ))}
            </div>
          </section>

          <section id="추천 검색어">
            <h2 className="text-base font-semibold text-foreground">추천 검색어</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {recommendedKeywords.map((keyword) => (
                <Link
                  key={keyword}
                  href={`/search?q=${encodeURIComponent(keyword)}`}
                  className="bg-foreground px-3.5 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/85"
                >
                  {keyword}
                </Link>
              ))}
            </div>
          </section>

          <section id="인기 검색어">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">인기 검색어</h2>
              <span className="text-xs text-muted-foreground">06.30 12:00 기준</span>
            </div>
            <ol className="grid gap-x-12 gap-y-0 md:grid-cols-2">
              {popularKeywords.map((keyword, index) => (
                <li key={keyword} className="border-b border-border/60">
                  <Link
                    href={`/search?q=${encodeURIComponent(keyword)}`}
                    className="grid grid-cols-[32px_minmax(0,1fr)_32px] items-center py-3 text-sm transition-colors hover:bg-secondary"
                  >
                    <span className="font-semibold tabular-nums text-foreground">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{keyword}</span>
                    <span className="text-center text-xs font-semibold text-muted-foreground">
                      {index % 5 === 0 ? "N" : index % 2 === 0 ? "▼" : "▲"}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {hasQuery ? (
            <section className="border-t border-border pt-8">
              <h2 className="text-base font-semibold text-foreground">
                ‘{initialQuery}’ 검색 결과
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                총 {results.length}개 상품
              </p>
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
          ) : null}
        </div>
      </div>
    </section>
  );
}
