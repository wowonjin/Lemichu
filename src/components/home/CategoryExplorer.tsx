import Link from "next/link";
import { categories } from "@/data/categories";
import { getTemporaryImageUrl } from "@/lib/placeholder";
import { SectionHeader } from "./SectionHeader";

export function CategoryExplorer() {
  return (
    <section className="container py-10 md:py-14">
      <SectionHeader title="카테고리로 둘러보기" moreHref="/category" />

      <ul className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-7 md:gap-4">
        {categories.map((category) => (
          <li key={category.id}>
            <Link href={category.href} className="group block">
              <div className="relative aspect-square overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getTemporaryImageUrl(category.id)}
                  alt={category.label}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-background/45" />
                <div className="absolute inset-0 grid place-items-center">
                  <category.icon
                    className="size-7 text-foreground/70 md:size-8"
                    strokeWidth={1.4}
                  />
                </div>
              </div>
              <div className="mt-2.5 text-center">
                <p className="text-[13px] font-semibold text-foreground md:text-sm">
                  {category.label}
                </p>
                <p className="hidden text-[11px] uppercase tracking-wider text-muted-foreground md:block">
                  {category.hint}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
