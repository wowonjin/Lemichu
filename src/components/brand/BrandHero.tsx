import Image from "next/image";
import Link from "next/link";
import type { Brand } from "@/data/brands";
import { Reveal } from "@/components/home/section-motion";

export function BrandHero({
  brand,
  productCount,
  logoSrc,
}: {
  brand: Brand;
  productCount: number;
  logoSrc?: string;
}) {
  return (
    <section className="bg-background" aria-labelledby="brand-hero-heading">
      <div className="container min-w-0 pb-6 pt-4 md:pb-10 md:pt-8">
        <nav className="flex items-center gap-1.5 text-[12px] text-[#8B8B8B] dark:text-muted-foreground md:text-[13px]">
          <Link href="/brand" className="transition-colors hover:text-foreground">
            브랜드관
          </Link>
          <span aria-hidden>›</span>
          <span className="text-foreground">{brand.name}</span>
        </nav>

        <Reveal className="mt-8 flex flex-col items-center text-center md:mt-10">
          {logoSrc ? (
            <>
              <h1 id="brand-hero-heading" className="sr-only">
                {brand.wordmark}
              </h1>
              <div className="relative h-[120px] w-[200px] md:h-[148px] md:w-[240px]">
                <Image
                  src={logoSrc}
                  alt={brand.wordmark}
                  fill
                  sizes="240px"
                  unoptimized
                  priority
                  className="object-contain"
                />
              </div>
            </>
          ) : (
            <h1
              id="brand-hero-heading"
              className="text-[26px] font-bold leading-none tracking-[0.06em] text-foreground sm:text-[32px] md:text-[42px]"
            >
              {brand.wordmark}
            </h1>
          )}

          <p className="mt-5 text-[15px] font-semibold tracking-tight text-foreground md:text-[16px]">
            {brand.name}
          </p>
          <p className="mt-1.5 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
            검수 완료 상품 {productCount}개
          </p>
        </Reveal>
      </div>
    </section>
  );
}
