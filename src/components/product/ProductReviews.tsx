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
              size === "md" ? "size-6" : "size-4",
              n <= value
                ? "fill-gold text-gold"
                : "fill-transparent text-border"
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
    reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);
  const distribution = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: reviews.filter((review) => review.rating === score).length,
  }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <section>
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

      <div className="mt-7 grid gap-3 md:mt-8 md:gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="rounded-[20px] bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7">
          <div className="flex items-end gap-2">
            <span className="text-[36px] font-bold leading-none tabular-nums tracking-tight text-foreground">
              {avg.toFixed(1)}
            </span>
            <span className="pb-0.5 text-[13px] text-[#8B8B8B] dark:text-muted-foreground">
              / 5.0
            </span>
          </div>
          <div className="mt-3">
            <Stars value={Math.round(avg)} />
          </div>
          <div className="mt-5 space-y-2">
            {distribution.map(({ score, count }) => {
              const percent = reviews.length ? (count / reviews.length) * 100 : 0;

              return (
                <div key={score} className="grid grid-cols-[34px_1fr_28px] items-center gap-2 text-xs">
                  <span className="text-[#8B8B8B] dark:text-muted-foreground">{score}점</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-[#E8E8E8] dark:bg-secondary">
                    <span
                      className="block h-full rounded-full bg-foreground"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="text-right text-[#8B8B8B] dark:text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={submit}
          className="flex flex-col rounded-[20px] bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[15px] font-bold tracking-tight text-foreground">리뷰 작성</p>
              <p className="mt-1 text-xs text-[#8B8B8B] dark:text-muted-foreground">
                상품 상태와 배송 경험을 간단히 남겨주세요.
              </p>
            </div>
            <Stars value={rating} onChange={setRating} size="md" />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="예) 상품 상태가 설명과 같았고, 포장이 꼼꼼했어요."
            className="mt-4 block w-full flex-1 resize-none rounded-[14px] border-0 bg-white p-4 text-sm leading-6 outline-none placeholder:text-[#B0B0B0] dark:bg-card dark:placeholder:text-muted-foreground"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-[#B0B0B0] dark:text-muted-foreground">
              {body.trim().length}/500
            </span>
            <Button type="submit" size="sm" disabled={!body.trim()} className="px-5">
              리뷰 등록
            </Button>
          </div>
        </form>
      </div>

      <ul className="mt-6 divide-y divide-[#EEEEEE] border-t border-[#EEEEEE] dark:divide-border dark:border-border md:mt-8">
        {reviews.map((review) => (
          <li key={review.id} className="grid gap-3 py-5 md:grid-cols-[160px_minmax(0,1fr)] md:py-6">
            <div>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {review.author}
              </span>
              <span className="mt-1 block text-xs text-[#B0B0B0] dark:text-muted-foreground">
                {review.date}
              </span>
            </div>
            <div>
              <Stars value={review.rating} />
              <p className="mt-2.5 text-sm leading-7 text-foreground">{review.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
