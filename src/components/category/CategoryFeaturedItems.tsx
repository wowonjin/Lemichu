import Image from "next/image";
import Link from "next/link";
import type { HomeCategoryContentItem } from "@/data/homeCategories";

export function CategoryFeaturedItems({
  items,
  title = "큐레이션",
}: {
  items: HomeCategoryContentItem[];
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const inner = (
            <>
              <span className="relative block aspect-square overflow-hidden bg-[#f4f6f8]">
                <Image
                  src={item.imageSrc}
                  alt={`${item.brand} ${item.title}`.trim()}
                  fill
                  sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
                  unoptimized
                  className="object-cover"
                />
              </span>
              <span className="mt-3 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {item.brand || "LEMICHU"}
              </span>
              <span className="mt-1 block text-sm font-semibold leading-5 text-foreground">
                {item.title}
              </span>
              {item.description ? (
                <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">
                  {item.description}
                </span>
              ) : null}
              {item.priceLabel ? (
                <span className="mt-2 block text-sm font-semibold tabular-nums text-foreground">
                  {item.priceLabel}
                </span>
              ) : null}
            </>
          );

          return (
            <li key={item.id}>
              {item.href ? (
                <Link href={item.href} className="block transition-opacity hover:opacity-80">
                  {inner}
                </Link>
              ) : (
                <article>{inner}</article>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
