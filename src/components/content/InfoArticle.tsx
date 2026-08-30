import type { InfoDoc } from "@/data/pageContent";

export function InfoArticle({ doc }: { doc: InfoDoc }) {
  return (
    <div className="container min-w-0 py-6 md:py-14">
      <div className="mx-auto max-w-3xl">
        <header>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {doc.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{doc.description}</p>
          {doc.updatedAt ? (
            <p className="mt-3 text-xs text-muted-foreground">
              최종 업데이트 {doc.updatedAt}
            </p>
          ) : null}
        </header>

        <div className="mt-8 space-y-8">
          {doc.sections.map((section) => (
            <section
              key={section.heading}
              className="rounded-2xl border border-border bg-sand p-5 md:p-6"
            >
              <h2 className="text-base font-semibold text-foreground md:text-lg">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              {section.bullets ? (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2 text-sm text-foreground/80"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
