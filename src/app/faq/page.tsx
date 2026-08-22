import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { faqGroups } from "@/data/faq";

export const metadata: Metadata = {
  title: "자주 묻는 질문 — LEMICHU",
};

export default function FaqPage() {
  return (
    <CustomerPageShell className="bg-background font-sans">
      <section>
        <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-end md:justify-between">
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            자주 묻는 질문
          </h1>
        </div>
        <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          배송, 정품 검수, 결제, 교환/반품 관련 궁금한 점을 카테고리별로 정리했습니다.
        </p>

        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-y border-border py-5 lg:sticky lg:top-36 lg:self-start">
            <h2 className="text-sm font-semibold text-foreground">카테고리</h2>
            <nav className="mt-4 divide-y divide-border">
              {faqGroups.map((group) => (
                <a
                  key={group.category}
                  href={`#faq-${group.category}`}
                  className="block py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {group.category}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-10">
            {faqGroups.map((group) => (
              <section key={group.category} id={`faq-${group.category}`}>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  {group.category}
                </h2>
                <div className="mt-3 divide-y divide-border border-y border-border">
                  {group.items.map((item) => (
                    <details key={item.q} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                        <span className="flex items-start gap-3">
                          <span className="font-semibold text-muted-foreground">Q</span>
                          {item.q}
                        </span>
                        <Plus className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" />
                      </summary>
                      <div className="pb-5 pl-7 pr-2 text-sm leading-7 text-muted-foreground">
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </CustomerPageShell>
  );
}
