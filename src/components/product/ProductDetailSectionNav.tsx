"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const SECTIONS = [
  { id: "product-images", mobileLabel: "이미지", label: "상품 이미지" },
  { id: "detail", mobileLabel: "정보", label: "상품정보" },
  { id: "delivery", mobileLabel: "배송", label: "배송/반품" },
  { id: "reviews", mobileLabel: "후기", label: "구매 고객 후기" },
  { id: "faq", mobileLabel: "FAQ", label: "FAQ" },
] as const;

function getStickyOffset() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--header-height");
  const headerHeight = Number.parseFloat(raw) || 96;
  const nav = document.querySelector("[data-product-section-nav]");
  const navHeight = nav instanceof HTMLElement ? nav.offsetHeight : 48;
  return headerHeight + navHeight + 8;
}

function getActiveSectionId() {
  const offset = getStickyOffset();
  let activeId = SECTIONS[0].id;

  for (const section of SECTIONS) {
    const element = document.getElementById(section.id);
    if (!element) continue;
    if (element.getBoundingClientRect().top - offset <= 0) {
      activeId = section.id;
    }
  }

  return activeId;
}

export function ProductDetailSectionNav() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setActiveId(getActiveSectionId());
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("hashchange", update);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("hashchange", update);
    };
  }, []);

  return (
    <nav
      data-product-section-nav
      className="sticky top-[var(--header-height)] z-30 -mx-4 max-w-[100vw] border-b border-[#EEEEEE] bg-background dark:border-border lg:mx-0 lg:max-w-none"
    >
      <div className="flex h-12 gap-4 overflow-x-auto px-4 text-[13px] font-semibold no-scrollbar md:h-14 md:gap-7 md:px-0 md:text-[14px]">
        {SECTIONS.map((section) => {
          const active = activeId === section.id;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active ? "true" : undefined}
              onClick={() => setActiveId(section.id)}
              className={cn(
                "flex shrink-0 items-center border-b-2 transition-colors",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-[#8B8B8B] hover:border-foreground hover:text-foreground dark:text-muted-foreground"
              )}
            >
              <span className="md:hidden">{section.mobileLabel}</span>
              <span className="hidden md:inline">{section.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
