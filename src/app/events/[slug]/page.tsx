import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { eventPosts, getEventPost } from "@/data/events";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return eventPosts.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventPost(slug);

  return {
    title: event ? `${event.title} — LEMICHU` : "이벤트 — LEMICHU",
  };
}

export default async function EventPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const event = getEventPost(slug);

  if (!event) {
    notFound();
  }

  const relatedEvents = eventPosts.filter((item) => item.slug !== event.slug);

  return (
    <article className="bg-white">
      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs font-medium text-muted-foreground md:text-sm">
            <span>{event.period}</span>
            <span aria-hidden="true">·</span>
            <span>이벤트</span>
            <span aria-hidden="true">·</span>
            <span>{event.badge}</span>
          </div>

          <h1 className="mt-5 text-center font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            {event.doc.title}
          </h1>

          <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
            작성자: LEMICHU 팀
          </p>

          <p className="mx-auto mt-10 text-center text-lg font-medium leading-relaxed text-foreground/75 md:text-xl">
            {event.doc.description}
          </p>

          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.image}
              alt={event.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <div className="mt-12 space-y-12 text-[17px] leading-8 text-foreground/80">
            {event.doc.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {section.heading}
                </h2>
                <div className="mt-5 space-y-4">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets ? (
                  <ul className="mt-6 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-3 size-1.5 shrink-0 rounded-full bg-gold" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <div className="mt-12 border-t border-border pt-5">
            <Link
              href="/events"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              이벤트로 돌아가기
            </Link>
          </div>

          {relatedEvents.length > 0 ? (
            <section className="mt-12">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  더 읽어보기
                </h2>
                <Link
                  href="/events"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  모두 보기
                </Link>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {relatedEvents.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/events/${related.slug}`}
                    className="block"
                  >
                    <div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={related.image}
                        alt={related.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground">
                      {related.title}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-gold">
                      {related.period}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}
