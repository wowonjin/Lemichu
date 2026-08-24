"use client";

import Image from "next/image";
import Link from "next/link";
import type { HomeCategoryItem } from "@/lib/homeCatalog";
import { Stagger, StaggerItem } from "@/components/home/section-motion";

export function CategoryQuickBar({ items }: { items: HomeCategoryItem[] }) {
  return (
    <section className="bg-background">
      <div className="container py-6 md:py-8">
        <div className="overflow-x-auto py-1 no-scrollbar">
          <Stagger
            as="ul"
            stagger={0.05}
            delay={0.04}
            className="flex justify-start gap-3 md:justify-center md:gap-5"
          >
            {items.map((item) => (
              <StaggerItem key={item.id} as="li" className="shrink-0">
                <Link href={item.href} className="group flex w-20 flex-col items-center gap-2.5">
                  <span className="relative grid size-[72px] place-items-center overflow-hidden rounded-md bg-[#f4f6f8] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#e8ecf0] md:size-20">
                    <Image
                      src={item.imageSrc}
                      alt=""
                      fill
                      sizes="80px"
                      unoptimized
                      className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  </span>
                  <span className="text-center text-[12px] font-medium text-foreground md:text-[13px]">
                    {item.label}
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
