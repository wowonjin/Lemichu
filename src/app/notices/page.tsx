import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";

export const metadata: Metadata = {
  title: "공지사항 — LEMICHU",
};

const notices = [
  { id: "n1", title: "레미츄 서비스 오픈 안내", date: "2026.06.29", category: "공지" },
  { id: "n2", title: "정품 검수 및 보상 정책 안내", date: "2026.06.29", category: "정책" },
  { id: "n3", title: "고객센터 운영시간 안내", date: "2026.06.29", category: "안내" },
];

export default function NoticesPage() {
  return (
    <CustomerPageShell className="bg-white bg-none font-sans">
      <section>
        <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-end md:justify-between">
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
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
              {["전체", "공지", "정책", "안내"].map((category) => (
                <span
                  key={category}
                  className="block py-3 text-sm text-muted-foreground"
                >
                  {category}
                </span>
              ))}
            </div>
          </aside>

          <div>
            <div className="mb-4 text-sm text-muted-foreground">
              총 {notices.length}개 공지
            </div>
            <div className="divide-y divide-border border-y border-border">
              {notices.map((notice) => (
                <article
                  key={notice.id}
                  className="grid gap-2 py-5 md:grid-cols-[96px_minmax(0,1fr)_120px] md:items-center"
                >
                  <span className="text-sm font-semibold text-muted-foreground">
                    {notice.category}
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">
                    {notice.title}
                  </h2>
                  <time className="text-sm text-muted-foreground md:text-right">
                    {notice.date}
                  </time>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </CustomerPageShell>
  );
}
