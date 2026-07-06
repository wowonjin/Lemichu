"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
};

const initialReviews: Review[] = [
  {
    id: "rv-1",
    author: "j****n",
    rating: 5,
    date: "2026.06.18",
    body: "검수 리포트까지 함께 와서 믿고 살 수 있었어요. 상태도 설명 그대로였습니다.",
  },
  {
    id: "rv-2",
    author: "s****2",
    rating: 4,
    date: "2026.06.11",
    body: "포장이 꼼꼼하고 배송도 안내받은 기간 안에 도착했어요. 만족합니다.",
  },
];

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

export function ProductReviews() {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
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
      <div className="flex flex-col gap-2 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">리뷰</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            구매자가 남긴 상품 상태, 배송, 포장 후기를 확인하세요.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          총 <span className="font-semibold text-foreground">{reviews.length}</span>개
        </span>
      </div>

      <div className="grid gap-8 border-b border-border py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-semibold tabular-nums text-foreground">
              {avg.toFixed(1)}
            </span>
            <span className="pb-1 text-sm text-muted-foreground">/ 5.0</span>
          </div>
          <div className="mt-3">
            <Stars value={Math.round(avg)} />
          </div>
          <div className="mt-5 space-y-2">
            {distribution.map(({ score, count }) => {
              const percent = reviews.length ? (count / reviews.length) * 100 : 0;

              return (
                <div key={score} className="grid grid-cols-[34px_1fr_28px] items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{score}점</span>
                  <span className="h-1.5 bg-secondary">
                    <span
                      className="block h-full bg-foreground"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={submit} className="border border-border">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">리뷰 작성</p>
              <p className="mt-1 text-xs text-muted-foreground">
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
            className="block w-full resize-none border-0 bg-background p-4 text-sm leading-6 outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              {body.trim().length}/500
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!body.trim()}
              className="rounded-none px-5"
            >
              리뷰 등록
            </Button>
          </div>
        </form>
      </div>

      <ul className="divide-y divide-border">
        {reviews.map((review) => (
          <li key={review.id} className="grid gap-3 py-5 md:grid-cols-[160px_minmax(0,1fr)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {review.author}
                </span>
              </div>
              <span className="mt-1 block text-xs text-muted-foreground">
                {review.date}
              </span>
            </div>
            <div>
              <Stars value={review.rating} />
              <p className="mt-3 text-sm leading-7 text-foreground">{review.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
