import Image from "next/image";
import Link from "next/link";
import { topBrands } from "@/data/topBrands";

export function BrandMoreBrands({ currentId }: { currentId: string }) {
  const brands = topBrands.filter((brand) => brand.id !== currentId).slice(0, 9);

  if (brands.length === 0) return null;

  return (
    <section className="border-t border-border/70 bg-background" aria-labelledby="brand-more-heading">
      <div className="container min-w-0 py-6 md:py-10">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="brand-more-heading"
            className="text-[15px] font-bold tracking-[0.04em] text-foreground md:text-base"
          >
            다른 브랜드
          </h2>
          <Link
            href="/brand"
            className="text-[12px] text-[#8B8B8B] transition-colors hover:text-foreground md:text-[13px]"
          >
            브랜드 전체보기
          </Link>
        </div>

        <ul className="mt-4 grid grid-cols-3">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Link
                href={brand.href}
                className="group flex aspect-[1.35] items-center justify-center px-4 py-5 md:aspect-[1.5] md:px-6"
                aria-label={brand.wordmark}
              >
                <span className="relative block h-full w-full">
                  <Image
                    src={brand.logoSrc}
                    alt={brand.wordmark}
                    fill
                    sizes="(min-width: 768px) 20vw, 30vw"
                    unoptimized
                    className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
