import type { Metadata } from "next";
import { privacyDoc } from "@/data/pageContent";

export const metadata: Metadata = {
  title: "개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main className="container py-10 md:py-14">
      <article className="mx-auto max-w-3xl">
        <header>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {privacyDoc.title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {privacyDoc.description}
          </p>
          {privacyDoc.updatedAt ? (
            <p className="mt-2 text-xs text-muted-foreground">
              최종 업데이트 : {privacyDoc.updatedAt}
            </p>
          ) : null}
        </header>

        <div className="mt-9 space-y-8 text-sm leading-7 text-muted-foreground">
          {privacyDoc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold text-foreground">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets?.map((bullet) => (
                  <p key={bullet}>{bullet}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
