import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Star } from "lucide-react";
import { homePurchaseReviews, inspectionEvidence } from "@/data/homeContent";
import { AUTHENTICITY_GUARANTEE } from "@/lib/guarantee";
import { cn } from "@/lib/cn";

function ReviewStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-px" aria-label={`${value}점`}>
      {[1, 2, 3, 4, 5].map((score) => (
        <Star
          key={score}
          className={cn(
            "size-3.5",
            score <= value ? "fill-gold text-gold" : "fill-transparent text-border"
          )}
        />
      ))}
    </div>
  );
}

export function TrustEvidenceSection() {
  return (
    <section className="bg-background" aria-labelledby="trust-evidence-heading">
      <div className="container py-12 md:py-16">
        <div className="max-w-[640px]">
          <h2
            id="trust-evidence-heading"
            className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]"
          >
            보이지 않는 부분까지 확인하고 보내드려요
          </h2>
          <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
            정품 여부부터 구성품과 컨디션까지, 출고 전 직접 확인합니다.
          </p>
        </div>

        <ul className="mt-7 grid grid-cols-2 gap-2.5 md:mt-8 md:gap-3 lg:grid-cols-4">
          {inspectionEvidence.map((item) => (
            <li key={item.id}>
              <article className="group overflow-hidden rounded-[20px] bg-[#F7F7F7] dark:bg-muted">
                <div className="relative aspect-[4/5] overflow-hidden md:aspect-square">
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 22vw, 48vw"
                    className="scale-[1.08] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.14]"
                  />
                </div>
                <div className="px-3.5 pb-4 pt-3 md:px-4 md:pb-5">
                  <h3 className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-foreground">
                    {item.title}
                    <Check className="size-3.5 text-gold" strokeWidth={2.6} aria-hidden />
                    <span className="sr-only">검수 완료</span>
                  </h3>
                  <p className="mt-1 text-[13px] leading-5 text-[#8B8B8B] dark:text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-12 md:mt-16">
          <h3 className="text-[18px] font-bold tracking-tight text-foreground md:text-[20px]">
            구매 인증 후기
          </h3>

          <ul className="mt-4 grid gap-2.5 md:mt-5 md:grid-cols-3 md:gap-3">
            {homePurchaseReviews.map((review) => (
              <li key={review.id}>
                <article className="h-full rounded-[20px] bg-[#F7F7F7] px-4 py-4 dark:bg-muted md:px-5 md:py-5">
                  <Link href={review.href} className="flex items-center gap-3">
                    <span className="relative size-[56px] shrink-0 overflow-hidden rounded-[12px] bg-[#EEF0F2]">
                      <Image
                        src={review.imageUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-contain p-1.5"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold tracking-tight text-foreground">
                        {review.brand}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] leading-5 text-[#8B8B8B] dark:text-muted-foreground">
                        {review.name}
                      </span>
                    </span>
                  </Link>

                  <div className="mt-3 flex items-center gap-2">
                    <ReviewStars value={review.rating} />
                    {review.verified ? (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#8B8B8B] dark:text-muted-foreground">
                        <Check className="size-3 text-gold" strokeWidth={2.6} aria-hidden />
                        구매 인증
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2.5 line-clamp-2 text-[14px] leading-6 text-foreground">
                    {review.body}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/policy/guarantee"
          className="mt-6 flex items-center justify-between gap-4 rounded-[20px] bg-[#F7F7F7] px-5 py-3.5 transition-colors hover:bg-[#F0F0F0] dark:bg-muted dark:hover:bg-secondary md:mt-8 md:px-6"
        >
          <span className="min-w-0 text-[13px] leading-5 text-foreground md:text-[14px]">
            {AUTHENTICITY_GUARANTEE}
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-foreground">
            보상 기준 보기
            <ChevronRight className="size-4 text-[#8B8B8B] dark:text-muted-foreground" />
          </span>
        </Link>
      </div>
    </section>
  );
}
