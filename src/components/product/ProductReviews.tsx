"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { defaultProductReviews, type ProductReview } from "@/data/productReviews";

function Stars({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={cn(!onChange && "cursor-default")}
          aria-label={`${n}점`}
        >
          <Star
            className={cn(
              size === "md" ? "size-5" : "size-3.5",
              n <= value ? "fill-gold text-gold" : "fill-transparent text-[#D0D0D0] dark:text-border"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({
  initialReviews = defaultProductReviews,
}: {
  initialReviews?: ProductReview[];
}) {
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  const avg =
    reviews.reduce((sum, review) => sum + review.rating, 0) / (reviews.length || 1);
  const distribution = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: reviews.filter((review) => review.rating === score).length,
  }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    setReviews((prev) => [
      {
        id: `rv-${Date.now()}`,
        author: "나",
        rating,
        date: new Date().toLocaleDateString("ko-KR").replace(/\s/g, ""),
        body: body.trim(),
      },
      ...prev,
    ]);
    setBody("");
    setRating(5);
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
            리뷰
          </h2>
          <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
            구매자가 남긴 상품 상태, 배송, 포장 후기를 확인하세요.
          </p>
        </div>
        <span className="shrink-0 text-[13px] text-[#8B8B8B] dark:text-muted-foreground md:text-[14px]">
          총 <span className="font-semibold text-foreground">{reviews.length}</span>개
        </span>
      </div>

      <div className="mt-7 rounded-md bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:mt-8 md:px-7 md:py-7">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          <span className="text-[36px] font-bold leading-none tabular-nums tracking-tight text-foreground">
            {reviews.length ? avg.toFixed(1) : "0.0"}
          </span>
          <div className="pb-0.5">
            <Stars value={reviews.length ? Math.round(avg) : 0} />
            <p className="mt-1 text-[12px] text-[#8B8B8B] dark:text-muted-foreground">
              5점 만점
            </p>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="mt-5 space-y-2">
            {distribution.map(({ score, count }) => {
              const percent = (count / reviews.length) * 100;
              return (
                <div
                  key={score}
                  className="grid grid-cols-[32px_minmax(0,1fr)_20px] items-center gap-2 text-[12px]"
                >
                  <span className="text-[#8B8B8B] dark:text-muted-foreground">{score}점</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-[#E8E8E8] dark:bg-secondary">
                    <span
                      className="block h-full rounded-full bg-foreground"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="text-right tabular-nums text-[#8B8B8B] dark:text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-[13px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
            아직 등록된 리뷰가 없어요. 첫 후기를 남겨 주세요.
          </p>
        )}
      </div>

      <form
        onSubmit={submit}
        className="mt-3 rounded-md bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px] font-bold tracking-tight text-foreground">리뷰 작성</p>
          <Stars value={rating} onChange={setRating} size="md" />
        </div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value.slice(0, 500))}
          rows={3}
          placeholder="상품 상태와 배송 경험을 간단히 남겨주세요."
          className="mt-4 block w-full resize-none rounded-md border-0 bg-white p-3.5 text-[13px] leading-6 outline-none placeholder:text-[#B0B0B0] dark:bg-card dark:placeholder:text-muted-foreground"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] text-[#B0B0B0] dark:text-muted-foreground">
            {body.trim().length}/500
          </span>
          <Button type="submit" size="sm" disabled={!body.trim()} className="px-5">
            리뷰 등록
          </Button>
        </div>
      </form>

      {reviews.length > 0 ? (
        <ul className="mt-6 divide-y divide-[#EEEEEE] border-t border-[#EEEEEE] dark:divide-border dark:border-border">
          {reviews.map((review) => (
            <li key={review.id} className="py-5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="text-[13px] font-semibold tracking-tight text-foreground">
                  {review.author}
                </span>
                <Stars value={review.rating} />
                <span className="text-[12px] text-[#B0B0B0] dark:text-muted-foreground">
                  {review.date}
                </span>
              </div>
              <p className="mt-2.5 text-[13px] leading-6 text-foreground md:text-[14px]">
                {review.body}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
