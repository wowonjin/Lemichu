import Image from "next/image";

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container flex h-full min-h-0 gap-10 pt-6 pb-3 lg:pt-8 lg:pb-3">
      <aside className="hidden h-full min-w-0 flex-[1.2] lg:block">
        <div className="relative h-full w-full overflow-hidden rounded-md bg-sand">
          <Image
            src="/hero/hero-new-v2.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover object-[72%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-white">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/75">
              LEMICHU
            </p>
            <p className="mt-2 text-2xl font-semibold leading-snug tracking-tight">
              검수된 명품을,
              <br />
              가장 안전하게
            </p>
          </div>
        </div>
      </aside>

      <section className="no-scrollbar flex min-h-0 min-w-0 flex-1 justify-center overflow-y-auto overscroll-contain">
        <div className="my-auto w-full max-w-[400px] py-2">{children}</div>
      </section>
    </div>
  );
}
