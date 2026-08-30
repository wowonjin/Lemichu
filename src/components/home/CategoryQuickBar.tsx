"use client";

import Image from "next/image";
import Link from "next/link";
import type { HomeCategoryItem } from "@/lib/homeCatalog";
import { Stagger, StaggerItem } from "@/components/home/section-motion";

function CategoryLabel({ label }: { label: string }) {
  const lines = label.split("*");
  return (
    <span className="text-center text-[11px] font-medium leading-4 text-foreground md:text-[13px] md:leading-5">
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </span>
  );
}

export function CategoryQuickBar({ items }: { items: HomeCategoryItem[] }) {
  return (
    <section className="bg-background">
      <div className="container pt-5 md:pt-8">
        <Stagger
          as="ul"
          stagger={0.05}
          delay={0.04}
          className="mx-auto grid max-w-sm grid-cols-3 justify-items-center gap-3 md:max-w-lg md:gap-8"
        >
          {items.map((item) => (
            <StaggerItem key={item.id} as="li">
              <Link href={item.href} className="group flex w-[4.25rem] flex-col items-center gap-2 md:w-24 md:gap-2.5">
                <span className="relative grid size-14 place-items-center overflow-hidden rounded-md bg-[#f4f6f8] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#e8ecf0] md:size-20">
                  {item.imageSrc ? (
                    <Image
                      src={item.imageSrc}
                      alt=""
                      fill
                      sizes="80px"
                      unoptimized
                      className="object-contain p-2.5 transition-transform duration-300 group-hover:scale-[1.04] md:p-3"
                    />
                  ) : (
                    <span className="text-[13px] font-bold tracking-[0.04em] text-[#F04452] md:text-base">
                      SALE
                    </span>
                  )}
                </span>
                <CategoryLabel label={item.label} />
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
