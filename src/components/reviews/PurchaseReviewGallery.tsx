import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { CatalogImage } from "@/components/product/CatalogImage";
import { cn } from "@/lib/cn";
import { purchaseReviews, type PurchaseReview } from "@/data/purchaseReviews";

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-px" aria-label={`${rating}점`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            "size-3 md:size-3.5",
            index < rating ? "fill-[#D4AF37] text-[#D4AF37]" : "fill-transparent text-white/25"
          )}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: PurchaseReview }) {
  return (
    <article className="overflow-hidden rounded-xl bg-[#2A2A2A]">
      <Link href={review.productHref} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#1F1F1F]">
          <CatalogImage
            src={review.imageSrc}
            alt={review.productName}
            seed={review.id}
            sizes="(min-width: 1024px) 22vw, (min-width: 768px) 33vw, 46vw"
            className="object-cover object-[center_42%]"
          />
        </div>
      </Link>

      <div className="px-2.5 pb-3 pt-2.5 md:px-5 md:pb-5 md:pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex h-5 items-center rounded-[4px] bg-[#D4AF37] px-1.5 text-[10px] font-semibold tracking-tight text-[#1A1A1A] md:h-6 md:text-[11px]">
            구매 인증
          </span>
          <ReviewStars rating={review.rating} />
        </div>

        <h3 className="mt-2 line-clamp-2 text-[13px] font-semibold leading-5 tracking-tight text-white md:mt-3 md:text-[15px] md:leading-6">
          <Link href={review.productHref} className="transition-colors hover:text-white/80">
            {review.productName}
          </Link>
        </h3>
        <p className="mt-1 text-[11px] text-white/45 md:mt-1.5 md:text-[12px]">
          {review.author} · {review.date}
        </p>
        <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-white/70 md:mt-3 md:text-[13px] md:leading-6">
          {review.body}
        </p>
        <p className="mt-2 hidden text-[11px] text-white/35 md:mt-3 md:block">{review.source}</p>
      </div>
    </article>
  );
}

export function PurchaseReviewGallery({
  reviews = purchaseReviews,
  showViewAll = true,
  className,
}: {
  reviews?: PurchaseReview[];
  showViewAll?: boolean;
  className?: string;
}) {
  return (
    <section id="reviews" className={cn("bg-[#1A1A1A] text-white", className)}>
      <div className="container home-section">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[20px] font-bold tracking-tight md:text-[30px]">구매 고객 후기</h2>
            <p className="mt-1.5 text-[13px] text-white/50 md:mt-2 md:text-[15px]">
              실제 구매 고객님이 남겨주신 후기입니다.
            </p>
          </div>
          {showViewAll ? (
            <Link
              href="/reviews"
              className="home-more text-white/55 hover:text-white dark:text-white/55 dark:hover:text-white"
            >
              전체보기
              <ChevronRight className="size-4" />
            </Link>
          ) : null}
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-2 md:mt-10 md:grid-cols-3 md:gap-5">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewCard review={review} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
