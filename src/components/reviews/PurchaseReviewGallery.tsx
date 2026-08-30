import Link from "next/link";
import { Star } from "lucide-react";
import { CatalogImage } from "@/components/product/CatalogImage";
import { cn } from "@/lib/cn";
import { purchaseReviews, type PurchaseReview } from "@/data/purchaseReviews";

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating}점`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            "size-3.5",
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
            sizes="(min-width: 1024px) 22vw, (min-width: 768px) 33vw, 90vw"
            className="object-cover"
          />
        </div>
      </Link>

      <div className="px-3.5 pb-4 pt-3.5 md:px-5 md:pb-5 md:pt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex h-6 items-center rounded-[4px] bg-[#D4AF37] px-1.5 text-[11px] font-semibold tracking-tight text-[#1A1A1A]">
            구매 인증
          </span>
          <ReviewStars rating={review.rating} />
        </div>

        <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-white">
          <Link href={review.productHref} className="transition-colors hover:text-white/80">
            {review.productName}
          </Link>
        </h3>
        <p className="mt-1.5 text-[12px] text-white/45">
          {review.author} · {review.date}
        </p>
        <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-white/70">{review.body}</p>
        <p className="mt-3 text-[11px] text-white/35">{review.source}</p>
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
        <div className="text-center">
          <h2 className="text-[20px] font-bold tracking-tight md:text-[30px]">구매 고객 후기</h2>
          <p className="mt-1.5 text-[13px] text-white/50 md:mt-2 md:text-[15px]">
            실제 구매 고객님이 남겨주신 후기입니다.
          </p>
        </div>

        <ul className="-mx-4 mt-6 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 no-scrollbar md:mx-0 md:mt-10 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0">
          {reviews.map((review) => (
            <li key={review.id} className="w-[78%] shrink-0 snap-start md:w-auto">
              <ReviewCard review={review} />
            </li>
          ))}
        </ul>

        {showViewAll ? (
          <div className="mt-8 flex justify-center md:mt-10">
            <Link
              href="/reviews"
              className="inline-flex h-11 items-center justify-center border border-[#D4AF37] px-6 text-[14px] font-semibold text-[#D4AF37] transition-colors hover:bg-[#D4AF37] hover:text-[#1A1A1A]"
            >
              후기 전체보기
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
