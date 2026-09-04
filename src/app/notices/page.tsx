import type { Metadata } from "next";
import Link from "next/link";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { cn } from "@/lib/cn";
import {
  filterNoticePosts,
  NOTICE_CATEGORIES,
  type NoticeCategory,
} from "@/data/notices";

export const metadata: Metadata = {
  title: "공지사항",
};

type SearchParams = Promise<{ category?: string }>;

function isNoticeCategory(value?: string): value is NoticeCategory | "전체" {
  return Boolean(value && NOTICE_CATEGORIES.includes(value as (typeof NOTICE_CATEGORIES)[number]));
}

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const search = await searchParams;
  const category = isNoticeCategory(search.category) ? search.category : "전체";
  const notices = filterNoticePosts(category);

  return (
    <CustomerPageShell className="bg-background font-sans">
      <section>
        <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-end md:justify-between">
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            공지사항
          </h1>
        </div>
        <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          레미츄의 주요 안내와 정책 업데이트를 확인하세요.
        </p>

        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-y border-border py-5 lg:sticky lg:top-36 lg:self-start">
            <h2 className="text-sm font-semibold text-foreground">분류</h2>
            <div className="mt-4 divide-y divide-border">
              {NOTICE_CATEGORIES.map((item) => {
                const href = item === "전체" ? "/notices" : `/notices?category=${item}`;
                const active = category === item;

                return (
                  <Link
                    key={item}
                    href={href}
                    className={cn(
                      "block py-3 text-sm transition-colors",
                      active
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item}
                  </Link>
                );
              })}
            </div>
          </aside>

          <div>
            <div className="mb-4 text-sm text-muted-foreground">
              총 {notices.length}개 공지
            </div>
            <div className="divide-y divide-border border-y border-border">
              {notices.map((notice) => (
                <Link
                  key={notice.slug}
                  href={`/notices/${notice.slug}`}
                  className="grid gap-2 py-5 transition-colors hover:bg-secondary/40 md:grid-cols-[96px_minmax(0,1fr)_120px] md:items-center"
                >
                  <span className="text-sm font-semibold text-muted-foreground">
                    {notice.category}
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">
                    {notice.title}
                  </h2>
                  <time
                    className="text-sm text-muted-foreground md:text-right"
                    dateTime={notice.date.replaceAll(".", "-")}
                  >
                    {notice.date}
                  </time>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </CustomerPageShell>
  );
}
