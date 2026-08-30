"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, ChevronRight, Star } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/home/section-motion";
import { homePurchaseReviews, inspectionEvidence } from "@/data/homeContent";
import { guaranteePolicy } from "@/data/pageContent";
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
      <div className="container home-section">
        <Reveal className="max-w-[640px]">
          <h2 id="trust-evidence-heading" className="home-title">
            보이지 않는 부분까지 확인하고 보내드려요
          </h2>
          <p className="home-desc">
            정품 여부부터 구성품과 컨디션까지, 출고 전 직접 확인합니다.
          </p>
        </Reveal>

        <Stagger
          as="ul"
          stagger={0.08}
          delay={0.08}
          className="mt-5 grid grid-cols-2 gap-2 md:mt-8 md:gap-3 lg:grid-cols-4"
        >
          {inspectionEvidence.map((item) => (
            <StaggerItem key={item.id} as="li" variant="up">
              <article className="group overflow-hidden bg-[#F7F7F7] dark:bg-muted">
                <div className="relative aspect-[4/5] overflow-hidden md:aspect-square">
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 22vw, 48vw"
                    className="scale-[1.08] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.14]"
                  />
                </div>
                <div className="px-3 pb-3.5 pt-2.5 md:px-4 md:pb-5 md:pt-3">
                  <h3 className="flex items-center gap-1.5 text-[13px] font-semibold tracking-tight text-foreground md:text-[15px]">
                    {item.title}
                    <Check className="size-3.5 text-gold" strokeWidth={2.6} aria-hidden />
                    <span className="sr-only">검수 완료</span>
                  </h3>
                  <p className="mt-1 text-[13px] leading-5 text-[#8B8B8B] dark:text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        {homePurchaseReviews.length > 0 ? (
        <div className="mt-8 md:mt-16">
          <Reveal>
            <h3 className="text-[16px] font-bold tracking-tight text-foreground md:text-[20px]">
              구매 인증 후기
            </h3>
          </Reveal>

          <Stagger
            as="ul"
            stagger={0.08}
            delay={0.06}
            className="mt-4 grid gap-2.5 md:mt-5 md:grid-cols-3 md:gap-3"
          >
            {homePurchaseReviews.map((review) => (
              <StaggerItem key={review.id} as="li" variant="soft">
                <article className="h-full rounded-md bg-[#F7F7F7] px-4 py-4 dark:bg-muted md:px-5 md:py-5">
                  <Link href={review.href} className="flex items-center gap-3">
                    <span className="relative size-[56px] shrink-0 overflow-hidden bg-[#EEF0F2]">
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
              </StaggerItem>
            ))}
          </Stagger>
        </div>
        ) : null}

        <div className="mt-12 md:mt-16">
          <Reveal className="flex items-start justify-between gap-4">
            <div className="min-w-0 max-w-2xl">
              <h3 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
                {AUTHENTICITY_GUARANTEE}
              </h3>
              <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
                {guaranteePolicy.description}
              </p>
            </div>
            <Link
              href="/policy/guarantee"
              className="mt-1.5 inline-flex shrink-0 items-center text-[13px] font-medium text-[#8B8B8B] transition-colors hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground md:text-[14px]"
            >
              정책 전체보기
              <ChevronRight className="size-4" />
            </Link>
          </Reveal>

          <Stagger
            stagger={0.06}
            delay={0.08}
            className="mt-6 border-t border-[#EEEEEE] dark:border-border md:mt-8"
          >
            {guaranteePolicy.sections.map((section) => (
              <StaggerItem key={section.heading} variant="fade">
              <details
                className="group border-b border-[#EEEEEE] dark:border-border"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-left text-[14px] font-medium text-foreground md:py-4 md:text-[15px] [&::-webkit-details-marker]:hidden">
                  {section.heading}
                  <ChevronDown className="size-4 shrink-0 text-[#8B8B8B] transition-transform duration-200 group-open:rotate-180 dark:text-muted-foreground" />
                </summary>
                <div className="space-y-2 pb-4 pr-8 text-[13px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[14px]">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets?.length ? (
                    <ul className="list-disc space-y-1 pl-4">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </details>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
