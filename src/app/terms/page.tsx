import type { Metadata } from "next";
import { termsDoc } from "@/data/pageContent";

export const metadata: Metadata = {
  title: "이용약관",
};

export default function TermsPage() {
  return (
    <main className="container py-10 md:py-14">
      <article className="mx-auto max-w-3xl">
        <header>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {termsDoc.title}
          </h1>
          {termsDoc.updatedAt ? (
            <p className="mt-3 text-xs text-muted-foreground">
              최종 업데이트 : {termsDoc.updatedAt}
            </p>
          ) : null}
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            {termsDoc.description}
          </p>
        </header>

        <div className="mt-9 space-y-8 text-sm leading-7 text-muted-foreground">
          {termsDoc.sections.map((section) => (
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
