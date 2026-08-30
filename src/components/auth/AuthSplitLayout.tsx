import Image from "next/image";

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-full flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-6 sm:pb-3 lg:h-full lg:max-w-[1280px] lg:flex-row lg:gap-10 lg:px-4 lg:pt-8 lg:pb-3">
      <aside className="hidden min-w-0 flex-[1.2] lg:block lg:h-full">
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

      <section className="flex w-full min-w-0 flex-1 justify-center lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:no-scrollbar">
        <div className="w-full min-w-0 max-w-[400px] py-1 sm:py-2 lg:my-auto">{children}</div>
      </section>
    </div>
  );
}
