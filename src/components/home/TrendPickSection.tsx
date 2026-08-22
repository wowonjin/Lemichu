import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatPrice, getDiscountRate } from "@/lib/formatPrice";
import { getPlaceholderGradient, isRealImage } from "@/lib/placeholder";
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
  paddingClassName = "p-3",
}: {
  product: Product;
  className?: string;
  sizes: string;
  paddingClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[#F7F7F7] dark:bg-muted", className)}>
      {isRealImage(product.imageUrl) ? (
        <Image
          src={product.imageUrl}
          alt=""
          fill
          sizes={sizes}
          className={cn(
            "object-contain mix-blend-multiply dark:mix-blend-normal",
            paddingClassName
          )}
        />
      ) : (
        <div
          className="h-full w-full"
          style={{ backgroundImage: getPlaceholderGradient(product.id) }}
        />
      )}
    </div>
  );
}

function RelatedThumb({ product }: { product: Product }) {
  const rate = product.discountRate ?? getDiscountRate(product.price, product.retailPrice);

  return (
    <div className="group/thumb relative aspect-square overflow-hidden rounded-[12px] bg-[#F7F7F7] dark:bg-muted">
      <ProductImage product={product} sizes="120px" className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/35 to-transparent px-1 pb-1.5 pt-8 opacity-0 transition-opacity duration-200 group-hover/thumb:opacity-100">
        <span className="max-w-full truncate rounded-full bg-white/92 px-1.5 py-0.5 text-[10px] font-medium tabular-nums tracking-tight text-[#6B6B6B] shadow-sm">
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
    <article className="w-[min(300px,78vw)] shrink-0 snap-start lg:w-auto">
      <Link href={story.href} className="group block" aria-label={`${story.title} 에디토리얼 보기`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[#F7F7F7] dark:bg-muted">
          {cover ? (
            <ProductImage
              product={cover}
              sizes="(min-width: 1024px) 28vw, 78vw"
              paddingClassName="p-10 transition-transform duration-700 ease-out group-hover:scale-[1.03] md:p-12"
              className="h-full w-full"
            />
          ) : null}
        </div>

        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[#B0B0B0] dark:text-muted-foreground">
          {story.editorialLabel}
        </p>
        <h3 className="mt-2 text-[18px] font-semibold leading-6 tracking-tight text-foreground md:text-[20px]">
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
    <section className="bg-background pb-12 md:pb-16" aria-labelledby="trend-heading">
      <div className="container pt-12 md:pt-16">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="trend-heading"
              className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]"
            >
              요즘 자주 보이는 명품만 모았어요
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
              이번 주 눈에 띄는 스타일과 제품을 에디터가 골랐어요.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1 pt-1.5">
            <p className="text-[13px] font-medium tabular-nums tracking-tight text-[#8B8B8B] dark:text-muted-foreground">
              이번 주 셀렉션 · {getThisWeekLabel()}
            </p>
            <Link
              href="/magazine"
              className="inline-flex items-center text-[13px] font-medium text-[#8B8B8B] transition-colors hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground md:text-[14px]"
            >
              전체보기
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 md:mt-8 lg:container">
        <div className="flex gap-5 overflow-x-auto px-4 pb-1 no-scrollbar snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:px-0">
          {stories.map((story) => (
            <EditorialCard key={story.id} story={story} />
          ))}
        </div>
      </div>
    </section>
  );
}
