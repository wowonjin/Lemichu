"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CatalogImage } from "@/components/product/CatalogImage";
import { SoldOutOverlay, isSoldProduct } from "@/components/product/SoldOutOverlay";
import { Reveal, Stagger, StaggerItem } from "@/components/home/section-motion";
import { cn } from "@/lib/cn";
import { formatPrice, getDiscountRate } from "@/lib/formatPrice";
import type { Product } from "@/types/product";

type TrendStory = {
  id: string;
  title: string;
  editorialLabel: string;
  excerpt: string;
  href: string;
  products: Product[];
};

function getThisWeekLabel(now = new Date()) {
  const weekday = now.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${start.getMonth() + 1}.${start.getDate()}–${end.getMonth() + 1}.${end.getDate()}`;
}

function ProductImage({
  product,
  className,
  sizes,
  imageClassName,
}: {
  product: Product;
  className?: string;
  sizes: string;
  imageClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[#F7F7F7] dark:bg-muted", className)}>
      <CatalogImage
        src={product.imageUrl}
        alt=""
        seed={product.id}
        sizes={sizes}
        className={cn(
          "object-cover mix-blend-multiply dark:mix-blend-normal",
          imageClassName
        )}
      />
      {isSoldProduct(product) ? <SoldOutOverlay /> : null}
    </div>
  );
}

function RelatedThumb({ product }: { product: Product }) {
  const rate = product.discountRate ?? getDiscountRate(product.price, product.retailPrice);

  return (
    <div className="group/thumb relative aspect-square overflow-hidden bg-[#F7F7F7] dark:bg-muted">
      <ProductImage product={product} sizes="120px" className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/35 to-transparent px-1 pb-1.5 pt-8 opacity-0 transition-opacity duration-200 group-hover/thumb:opacity-100">
        <span className="max-w-full truncate rounded-md bg-white/92 px-1.5 py-0.5 text-[10px] font-medium tabular-nums tracking-tight text-[#6B6B6B] shadow-sm">
          {rate ? <span className="mr-0.5 text-[#F04452]">{rate}%</span> : null}
          {formatPrice(product.price)}
        </span>
      </div>
    </div>
  );
}

function EditorialCard({ story }: { story: TrendStory }) {
  const cover = story.products[0];
  const related =
    story.products.length > 3 ? story.products.slice(1, 4) : story.products.slice(0, 3);

  return (
    <article>
      <Link href={story.href} className="group block" aria-label={`${story.title} 에디토리얼 보기`}>
        <div className="relative aspect-square overflow-hidden bg-[#F7F7F7] dark:bg-muted">
          {cover ? (
            <ProductImage
              product={cover}
              sizes="(min-width: 1024px) 28vw, 78vw"
              imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              className="h-full w-full"
            />
          ) : null}
        </div>

        <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#B0B0B0] dark:text-muted-foreground md:mt-4">
          {story.editorialLabel}
        </p>
        <h3 className="mt-1.5 text-[16px] font-semibold leading-6 tracking-tight text-foreground md:mt-2 md:text-[20px]">
          {story.title}
        </h3>
        <p className="mt-1.5 truncate text-[13px] leading-5 text-[#8B8B8B] dark:text-muted-foreground">
          {story.excerpt}
        </p>

        {related.length > 0 ? (
          <div className="mt-5 grid grid-cols-3 gap-2">
            {related.map((product) => (
              <RelatedThumb key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </Link>
    </article>
  );
}

export function TrendPickSection({ stories }: { stories: TrendStory[] }) {
  if (stories.length === 0) return null;

  return (
    <section className="bg-background pb-8 md:pb-16" aria-labelledby="trend-heading">
      <div className="container pt-8 md:pt-16">
        <Reveal className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="trend-heading" className="home-title">
              요즘 자주 보이는 명품만 모았어요
            </h2>
            <p className="home-desc">
              이번 주 눈에 띄는 스타일과 제품을 에디터가 골랐어요.
            </p>
          </div>

          <Link href="/magazine" className="home-more mt-1">
            전체보기
            <ChevronRight className="size-4" />
          </Link>
        </Reveal>
        <p className="mt-1 hidden text-[13px] font-medium tabular-nums tracking-tight text-[#8B8B8B] dark:text-muted-foreground md:block">
          이번 주 셀렉션 · {getThisWeekLabel()}
        </p>
      </div>

      <div className="mt-5 md:mt-8 lg:container">
        <div className="overflow-x-auto px-4 py-1 no-scrollbar lg:overflow-visible lg:px-0">
          <Stagger
            stagger={0.1}
            delay={0.08}
            className="flex snap-x snap-mandatory gap-3 lg:grid lg:grid-cols-3 lg:gap-8"
          >
            {stories.map((story) => (
              <StaggerItem
                key={story.id}
                variant="up"
                className="w-[min(260px,72vw)] shrink-0 snap-start lg:w-auto"
              >
                <EditorialCard story={story} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
