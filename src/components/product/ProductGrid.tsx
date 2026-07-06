import { ProductCard } from "./ProductCard";
import type { Product } from "@/types/product";

export function ProductGrid({
  products,
  cardClassName,
  imageClassName,
  hideAuthenticationBadge,
  hiddenBadges,
}: {
  products: Product[];
  cardClassName?: string;
  imageClassName?: string;
  hideAuthenticationBadge?: boolean;
  hiddenBadges?: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          className={cardClassName}
          imageClassName={imageClassName}
          hideAuthenticationBadge={hideAuthenticationBadge}
          hiddenBadges={hiddenBadges}
        />
      ))}
    </div>
  );
}
