"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ImagePlus, Star, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/useAuthUser";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getLoginHref } from "@/lib/redirect";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { uploadReviewPhoto } from "@/lib/review-images";
import {
  fetchProductReviews,
  fetchReviewEligibility,
  submitProductReview,
} from "@/lib/reviews-client";
import { publishPointsChanged } from "@/lib/points";
import {
  REVIEW_CHANGED_EVENT,
  REVIEW_MAX_BODY,
  REVIEW_MAX_PHOTOS,
  REVIEW_MIN_BODY,
  REVIEW_PHOTO_POINTS,
  REVIEW_RATING_LABELS,
  REVIEW_TEXT_POINTS,
  canSubmitReviewDraft,
  defaultProductReviews,
  eligibilityMessage,
  filterProductReviews,
  getReviewSummary,
  sortProductReviews,
  type ProductReview,
  type ReviewEligibility,
  type ReviewSort,
  type ReviewSummary,
} from "@/lib/reviews";

function Stars({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          className={cn(!onChange && "cursor-default")}
          aria-label={`${n}점`}
        >
          <Star
            className={cn(
              size === "md" ? "size-5" : "size-3.5",
              n <= shown ? "fill-gold text-gold" : "fill-transparent text-[#D0D0D0] dark:text-border"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function publishReviewSummary(productId: string, summary: ReviewSummary) {
  window.dispatchEvent(
    new CustomEvent(REVIEW_CHANGED_EVENT, {
      detail: { productId, summary },
    })
  );
}

function EligibilityGate({
  eligibility,
  productId,
}: {
  eligibility: ReviewEligibility;
  productId: string;
}) {
  const loginHref = getLoginHref(`/product/${productId}#reviews`);

  if (eligibility.status === "need_login") {
    return (
      <div className="mt-3 rounded-md bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7">
        <p className="text-[15px] font-bold tracking-tight text-foreground">리뷰 작성</p>
        <p className="mt-2 text-[13px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
          {eligibility.message}
        </p>
        <Button asChild size="sm" className="mt-4 px-5">
          <Link href={loginHref}>로그인하고 작성하기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7">
      <p className="text-[15px] font-bold tracking-tight text-foreground">리뷰 작성</p>
      <p className="mt-2 text-[13px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
        {eligibility.message}
      </p>
      {eligibility.status === "not_purchased" ? (
        <p className="mt-1 text-[12px] text-[#B0B0B0] dark:text-muted-foreground">
          구매 확정 후 {eligibility.points.text}원, 사진 포함 시 {eligibility.points.photo}원이 적립됩니다.
        </p>
      ) : null}
    </div>
  );
}

export function ProductReviews({
  productId,
  initialReviews = defaultProductReviews,
}: {
  productId: string;
  initialReviews?: ProductReview[];
}) {
  const { user, ready, isLoggedIn } = useAuthUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const summary = useMemo(() => getReviewSummary(reviews), [reviews]);
  const visibleReviews = useMemo(
    () => sortProductReviews(filterProductReviews(reviews, ratingFilter), sort),
    [ratingFilter, reviews, sort]
  );
  const canSubmit =
    eligibility?.status === "eligible" &&
    canSubmitReviewDraft({ rating, body, photoUrls }) &&
    !submitting &&
    !uploading;

  useEffect(() => {
    setReviews(initialReviews);
    publishReviewSummary(productId, getReviewSummary(initialReviews));
  }, [initialReviews, productId]);

  useEffect(() => {
    let cancelled = false;

    fetchProductReviews(productId)
      .then((result) => {
        if (cancelled) return;
        setReviews(result.reviews);
        publishReviewSummary(productId, result.summary);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    fetchReviewEligibility(productId)
      .then((next) => {
        if (!cancelled) setEligibility(next);
      })
      .catch(() => {
        if (!cancelled) {
          const status = isLoggedIn ? "not_purchased" : "need_login";
          setEligibility({
            status,
            message: eligibilityMessage(status),
            points: { text: REVIEW_TEXT_POINTS, photo: REVIEW_PHOTO_POINTS },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, productId, ready]);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length || !user?.uid) return;
    const remain = REVIEW_MAX_PHOTOS - photoUrls.length;
    if (remain <= 0) return;

    setUploading(true);
    setError("");

    try {
      const selected = Array.from(files).slice(0, remain);
      const uploaded = await Promise.all(
        selected.map((file, index) =>
          uploadReviewPhoto({
            file,
            userId: user.uid as string,
            productId,
            index: photoUrls.length + index,
          })
        )
      );
      setPhotoUrls((prev) => [...prev, ...uploaded].slice(0, REVIEW_MAX_PHOTOS));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "사진을 올리지 못했어요.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const result = await submitProductReview({
        productId,
        rating,
        body,
        photoUrls,
      });
      const nextReviews = [result.review, ...reviews.filter((review) => review.id !== result.review.id)];
      const nextSummary = result.summary ?? getReviewSummary(nextReviews);
      setReviews(nextReviews);
      publishReviewSummary(productId, nextSummary);
      setEligibility({
        status: "already_reviewed",
        message: eligibilityMessage("already_reviewed"),
        existingReviewId: result.review.id,
        points: eligibility?.points ?? { text: REVIEW_TEXT_POINTS, photo: REVIEW_PHOTO_POINTS },
      });
      setBody("");
      setPhotoUrls([]);
      setRating(5);
      if (result.pointsGranted > 0) {
        publishPointsChanged();
      }
      setSuccess(
        result.pointsGranted > 0
          ? `리뷰가 등록되었어요. 적립금 ${formatPriceWithUnit(result.pointsGranted)}이 지급되었어요.`
          : "리뷰가 등록되었어요."
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "리뷰를 등록하지 못했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
            리뷰
          </h2>
          <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
            구매 확정한 고객의 상품 상태, 배송, 포장 후기를 확인하세요.
          </p>
        </div>
        <span className="shrink-0 text-[13px] text-[#8B8B8B] dark:text-muted-foreground md:text-[14px]">
          총 <span className="font-semibold text-foreground">{summary.count}</span>개
        </span>
      </div>

      <div className="mt-7 rounded-md bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:mt-8 md:px-7 md:py-7">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          <span className="text-[36px] font-bold leading-none tabular-nums tracking-tight text-foreground">
            {summary.averageLabel}
          </span>
          <div className="pb-0.5">
            <Stars value={reviews.length ? Math.round(summary.average) : 0} />
            <p className="mt-1 text-[12px] text-[#8B8B8B] dark:text-muted-foreground">
              5점 만점
            </p>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="mt-5 space-y-2">
            {summary.distribution.map(({ score, count }) => {
              const percent = (count / reviews.length) * 100;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => setRatingFilter((prev) => (prev === score ? undefined : score))}
                  className="grid w-full grid-cols-[32px_minmax(0,1fr)_20px] items-center gap-2 text-[12px]"
                >
                  <span className={cn(ratingFilter === score ? "font-semibold text-foreground" : "text-[#8B8B8B] dark:text-muted-foreground")}>
                    {score}점
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-[#E8E8E8] dark:bg-secondary">
                    <span
                      className="block h-full rounded-full bg-foreground"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="text-right tabular-nums text-[#8B8B8B] dark:text-muted-foreground">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-[13px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
            아직 등록된 리뷰가 없어요. 구매 확정 후 첫 후기를 남겨 주세요.
          </p>
        )}
      </div>

      {!eligibility || eligibility.status !== "eligible" ? (
        eligibility ? <EligibilityGate eligibility={eligibility} productId={productId} /> : (
          <div className="mt-3 rounded-md bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7">
            <p className="text-[13px] text-[#8B8B8B] dark:text-muted-foreground">
              리뷰 작성 가능 여부를 확인하고 있어요.
            </p>
          </div>
        )
      ) : (
        <form
          onSubmit={submit}
          className="mt-3 rounded-md bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-bold tracking-tight text-foreground">리뷰 작성</p>
              <p className="mt-1 text-[12px] text-[#8B8B8B] dark:text-muted-foreground">
                텍스트 {formatPriceWithUnit(eligibility.points.text)} · 사진 포함 {formatPriceWithUnit(eligibility.points.photo)} 적립
                {eligibility.option ? ` · ${eligibility.option}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Stars value={rating} onChange={setRating} size="md" />
              <span className="text-[12px] text-[#8B8B8B] dark:text-muted-foreground">
                {REVIEW_RATING_LABELS[rating as 1 | 2 | 3 | 4 | 5]}
              </span>
            </div>
          </div>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, REVIEW_MAX_BODY))}
            rows={3}
            placeholder="상품 상태와 배송 경험을 구체적으로 남겨 주세요."
            className="mt-4 block w-full resize-none rounded-md border-0 bg-white p-3.5 text-[13px] leading-6 outline-none placeholder:text-[#B0B0B0] dark:bg-card dark:placeholder:text-muted-foreground"
          />
          {isFirebaseConfigured ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {photoUrls.map((url, index) => (
                <span key={url} className="relative size-16 overflow-hidden rounded-md bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrls((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                    aria-label="사진 삭제"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {photoUrls.length < REVIEW_MAX_PHOTOS ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex size-16 flex-col items-center justify-center gap-1 rounded-md bg-white text-[11px] text-[#8B8B8B] dark:bg-card dark:text-muted-foreground"
                >
                  <ImagePlus className="size-4" />
                  {uploading ? "업로드" : "사진"}
                </button>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                hidden
                onChange={(event) => addPhotos(event.target.files)}
              />
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[12px] text-[#B0B0B0] dark:text-muted-foreground">
              {body.trim().length}/{REVIEW_MAX_BODY}
              {body.trim().length < REVIEW_MIN_BODY
                ? ` · 최소 ${REVIEW_MIN_BODY}자`
                : ""}
            </span>
            <Button type="submit" size="sm" disabled={!canSubmit} className="px-5">
              {submitting ? "등록 중" : "리뷰 등록"}
            </Button>
          </div>
          {error ? (
            <p className="mt-3 text-[12px] leading-5 text-rose-600" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}

      {success ? (
        <p className="mt-3 text-[13px] leading-6 text-foreground" role="status">
          {success}
        </p>
      ) : null}

      {reviews.length > 0 ? (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2 text-[12px]">
              {([
                ["newest", "최신순"],
                ["highest", "별점높은순"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSort(value)}
                  className={cn(
                    "rounded-md px-2.5 py-1",
                    sort === value ? "bg-foreground text-background" : "text-[#8B8B8B] dark:text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {ratingFilter ? (
              <button
                type="button"
                onClick={() => setRatingFilter(undefined)}
                className="text-[12px] text-[#8B8B8B] underline-offset-4 hover:text-foreground hover:underline dark:text-muted-foreground"
              >
                {ratingFilter}점 필터 해제
              </button>
            ) : null}
          </div>
          <ul className="mt-2 divide-y divide-[#EEEEEE] border-t border-[#EEEEEE] dark:divide-border dark:border-border">
            {visibleReviews.map((review) => (
              <li key={review.id} className="py-5">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="text-[13px] font-semibold tracking-tight text-foreground">
                    {review.author}
                  </span>
                  <Stars value={review.rating} />
                  {review.verified ? (
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-[#8B8B8B] dark:text-muted-foreground">
                      <Check className="size-3 text-gold" strokeWidth={2.6} />
                      구매 인증
                    </span>
                  ) : null}
                  {review.isMine ? (
                    <span className="text-[11px] text-[#8B8B8B] dark:text-muted-foreground">내 리뷰</span>
                  ) : null}
                  <span className="text-[12px] text-[#B0B0B0] dark:text-muted-foreground">
                    {review.date}
                  </span>
                </div>
                {review.option ? (
                  <p className="mt-1 text-[12px] text-[#8B8B8B] dark:text-muted-foreground">
                    {review.option}
                  </p>
                ) : null}
                <p className="mt-2.5 text-[13px] leading-6 text-foreground md:text-[14px]">
                  {review.body}
                </p>
                {review.photoUrls && review.photoUrls.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {review.photoUrls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="relative size-20 overflow-hidden rounded-md bg-[#F7F7F7] dark:bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="size-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
