import type { Metadata } from "next";
import { PurchaseReviewGallery } from "@/components/reviews/PurchaseReviewGallery";
import { purchaseReviews } from "@/data/purchaseReviews";

export const metadata: Metadata = {
  title: "구매 고객 후기",
  description: "실제 구매 고객님이 남겨주신 후기입니다.",
};

export default function ReviewsPage() {
  return (
    <PurchaseReviewGallery reviews={purchaseReviews} showViewAll={false} className="min-h-[60vh]" />
  );
}
