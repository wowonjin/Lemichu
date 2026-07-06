"use client";

import Link from "next/link";

const quickButtons = [
  { label: "내 상품 판매하기", href: "/sell", icon: "sell" },
  { label: "고객센터", href: "/faq", icon: "support" },
  { label: "공지사항", href: "/notices", icon: "notice" },
];

type FloatingIconName = "sell" | "support" | "notice" | "top";

function FloatingIcon({ name }: { name: FloatingIconName }) {
  if (name === "sell") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden className="size-7">
        <path d="M9.5 13.5h13l1.6 11h-16.2l1.6-11Z" fill="currentColor" opacity="0.12" />
        <path d="M9.5 13.5h13l1.6 11h-16.2l1.6-11Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M12.3 13.3c.3-3.1 1.8-5.1 3.7-5.1s3.4 2 3.7 5.1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M12.8 19h6.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M19.8 18.2l1.2 1.2 2.4-2.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "support") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden className="size-7">
        <path d="M8.5 14.5c0-4.2 3.3-7.3 7.5-7.3s7.5 3.1 7.5 7.3v4.8c0 2.8-2.2 5-5 5H17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M8.3 15.2h3.2v6h-1.7a1.5 1.5 0 0 1-1.5-1.5v-4.5ZM23.7 15.2h-3.2v6h1.7a1.5 1.5 0 0 0 1.5-1.5v-4.5Z" fill="currentColor" opacity="0.12" />
        <path d="M8.3 15.2h3.2v6h-1.7a1.5 1.5 0 0 1-1.5-1.5v-4.5ZM23.7 15.2h-3.2v6h1.7a1.5 1.5 0 0 0 1.5-1.5v-4.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="15.8" cy="24.2" r="1.3" fill="currentColor" />
      </svg>
    );
  }

  if (name === "notice") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden className="size-7">
        <path d="M10 8.5h9l3 3v12H10v-15Z" fill="currentColor" opacity="0.12" />
        <path d="M10 8.5h9l3 3v12H10v-15Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M19 8.5v3h3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M13.5 15.5h5M13.5 19h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M8 11.5h2M8 15h2M8 18.5h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.55" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden className="size-7">
      <circle cx="16" cy="16" r="9" fill="currentColor" opacity="0.1" />
      <path d="M16 23V9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M10.5 14.5 16 9l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none translate-x-2 whitespace-nowrap rounded-full bg-gold px-3.5 py-2 text-sm font-semibold text-white opacity-0 shadow-lg transition-all group-hover:translate-x-0 group-hover:opacity-100">
      {label}
    </span>
  );
}

export function FloatingQuickButtons() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Desktop: full vertical quick-action stack (hidden on mobile to avoid
          overlapping content and the bottom navigation) */}
      <div className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-end gap-3 md:right-6 md:flex">
        {quickButtons.map((button) => (
          <div key={button.href} className="group flex items-center gap-3">
            <Tooltip label={button.label} />
            <Link
              href={button.href}
              aria-label={button.label}
              title={button.label}
              className="grid size-14 place-items-center rounded-full bg-background text-foreground shadow-[0_10px_28px_rgba(15,23,42,0.16)] ring-1 ring-border transition-colors hover:bg-secondary"
            >
              <span className="text-foreground/75">
                <FloatingIcon name={button.icon as FloatingIconName} />
              </span>
            </Link>
          </div>
        ))}
        <div className="group flex items-center gap-3">
          <Tooltip label="맨 위로" />
          <button
            type="button"
            aria-label="맨 위로"
            title="맨 위로"
            onClick={scrollToTop}
            className="grid size-14 place-items-center rounded-full bg-background text-foreground shadow-[0_10px_28px_rgba(15,23,42,0.16)] ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <span className="text-foreground/75">
              <FloatingIcon name="top" />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile: a single compact quick-actions cluster sitting just above the
          bottom navigation so it never covers product content */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2.5 md:hidden">
        <Link
          href="/sell"
          aria-label="내 상품 판매하기"
          title="내 상품 판매하기"
          className="grid size-12 place-items-center rounded-full bg-foreground text-background shadow-[0_8px_22px_rgba(15,23,42,0.22)]"
        >
          <span className="scale-90">
            <FloatingIcon name="sell" />
          </span>
        </Link>
        <button
          type="button"
          aria-label="맨 위로"
          title="맨 위로"
          onClick={scrollToTop}
          className="grid size-12 place-items-center rounded-full bg-background text-foreground shadow-[0_8px_22px_rgba(15,23,42,0.16)] ring-1 ring-border"
        >
          <span className="scale-90 text-foreground/75">
            <FloatingIcon name="top" />
          </span>
        </button>
      </div>
    </>
  );
}
