import { cn } from "@/lib/cn";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types/product";

export function ProductGrid({
  products,
  className,
  cardClassName,
  imageClassName,
  hideAuthenticationBadge,
  hiddenBadges,
  variant,
  editMode,
  selectedIds,
  onSelect,
  onUnwish,
}: {
  products: Product[];
  className?: string;
  cardClassName?: string;
  imageClassName?: string;
  hideAuthenticationBadge?: boolean;
  hiddenBadges?: string[];
  variant?: "default" | "wishlist";
  editMode?: boolean;
  selectedIds?: string[];
  onSelect?: (productId: string) => void;
  onUnwish?: (product: Product) => Promise<void> | void;
}) {
  const selected = new Set(selectedIds ?? []);

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4 xl:grid-cols-5",
        className
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          className={cardClassName}
          imageClassName={imageClassName}
          hideAuthenticationBadge={hideAuthenticationBadge}
          hiddenBadges={hiddenBadges}
          variant={variant}
          editMode={editMode}
          selected={selected.has(product.id)}
          onSelect={onSelect}
          onUnwish={onUnwish}
        />
      ))}
    </div>
  );
}
