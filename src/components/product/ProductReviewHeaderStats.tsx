"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { REVIEW_CHANGED_EVENT, type ReviewSummary } from "@/lib/reviews";

export function ProductReviewHeaderStats({
  productId,
  initialSummary,
}: {
  productId: string;
  initialSummary: Pick<ReviewSummary, "count" | "averageLabel">;
}) {
  const [summary, setSummary] = useState(initialSummary);

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary, productId]);

  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ productId?: string; summary?: ReviewSummary }>).detail;
      if (!detail?.summary || detail.productId !== productId) return;
      setSummary({
        count: detail.summary.count,
        averageLabel: detail.summary.averageLabel,
      });
    };

    window.addEventListener(REVIEW_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(REVIEW_CHANGED_EVENT, onChange);
  }, [productId]);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1 text-foreground">
        <Star className="size-3.5 fill-gold text-gold" />
        <span className="font-semibold">{summary.averageLabel}</span>
      </span>
      <Link
        href="#reviews"
        className="text-[#8B8B8B] underline-offset-4 transition-colors hover:text-foreground hover:underline dark:text-muted-foreground"
      >
        리뷰 {summary.count}개
      </Link>
    </span>
  );
}
