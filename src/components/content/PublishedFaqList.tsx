"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { fetchPublishedFaqs } from "@/lib/member-account-client";
import { groupFaqs, type MemberFaq } from "@/lib/member-account";

export function PublishedFaqList() {
  const [groups, setGroups] = useState<Array<{ category: string; items: MemberFaq[] }>>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublishedFaqs()
      .then((items) => setGroups(groupFaqs(items)))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "FAQ를 불러오지 못했어요."));
  }, []);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">FAQ를 불러오는 중입니다.</p>;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="border-y border-border py-5 lg:sticky lg:top-36 lg:self-start">
        <h2 className="text-sm font-semibold text-foreground">카테고리</h2>
        <nav className="mt-4 divide-y divide-border">
          {groups.map((group) => (
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
        {groups.map((group) => (
          <section key={group.category} id={`faq-${group.category}`}>
            <h2 className="text-base font-semibold tracking-tight text-foreground">{group.category}</h2>
            <div className="mt-3 divide-y divide-border border-y border-border">
              {group.items.map((item) => (
                <details key={item.id} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start gap-3">
                      <span className="font-semibold text-muted-foreground">Q</span>
                      {item.question}
                    </span>
                    <Plus className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" />
                  </summary>
                  <div className="pb-5 pl-7 pr-2 text-sm leading-7 text-muted-foreground">{item.answer}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
