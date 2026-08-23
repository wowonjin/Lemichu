export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
  productName?: string;
  verified?: boolean;
};

export const defaultProductReviews: ProductReview[] = [];

export function getReviewSummary(reviews: ProductReview[] = defaultProductReviews) {
  const count = reviews.length;
  const average =
    count === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / count;

  return {
    count,
    average,
    averageLabel: average.toFixed(1),
  };
}
