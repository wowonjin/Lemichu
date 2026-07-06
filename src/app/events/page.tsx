import type { Metadata } from "next";
import Link from "next/link";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { eventPosts } from "@/data/events";

export const metadata: Metadata = {
  title: "이벤트 — LEMICHU",
};

export default function EventsPage() {
  return (
    <CustomerPageShell className="bg-white bg-none font-sans">
      <section>
        <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-end md:justify-between">
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            이벤트
          </h2>
        </div>
        <div className="mb-6 mt-3 text-sm text-muted-foreground">
          총 {eventPosts.length}개 이벤트
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventPosts.map((event) => (
            <Link
              key={event.slug}
              href={`/events/${event.slug}`}
              className="block"
            >
              <div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-border bg-transparent">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.image}
                  alt={event.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <h2 className="mt-4 text-base font-semibold text-foreground">
                {event.title}
              </h2>
              <p className="mt-1.5 text-sm font-medium text-gold">
                {event.period}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </CustomerPageShell>
  );
}
