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
          className="mx-auto grid max-w-md grid-cols-5 justify-items-center gap-1 md:max-w-2xl md:gap-4"
        >
          {items.map((item) => {
            const external = item.href.startsWith("http");
            return (
              <StaggerItem key={item.id} as="li">
                <Link
                  href={item.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="group flex w-[3.4rem] flex-col items-center gap-1.5 md:w-20 md:gap-2.5"
                >
                  <span className="relative grid size-12 place-items-center overflow-hidden rounded-md bg-[#f4f6f8] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#e8ecf0] md:size-16">
                    {item.imageSrc ? (
                      <Image
                        src={item.imageSrc}
                        alt=""
                        fill
                        sizes="64px"
                        unoptimized
                        className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.04] md:p-2.5"
                      />
                    ) : item.id === "sale" ? (
                      <span className="text-[11px] font-bold tracking-[0.04em] text-[#F04452] md:text-sm">
                        SALE
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-foreground md:text-sm">
                        판매
                      </span>
                    )}
                  </span>
                  <CategoryLabel label={item.label} />
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
