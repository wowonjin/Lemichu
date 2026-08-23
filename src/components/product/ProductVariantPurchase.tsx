"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { cn } from "@/lib/cn";
import { getDiscountRate } from "@/lib/formatPrice";
import { formatProductOptions } from "@/lib/productOptions";
import {
  getPurchasableVariants,
  getVariantLabel,
  getVariantPrice,
  isVariantAvailable,
} from "@/lib/product-variants";
import type { Product, ProductVariant } from "@/types/product";

type ProductVariantPurchaseValue = {
  product: Product;
  selectedVariant?: ProductVariant;
  selectedPrice: number;
  canPurchase: boolean;
  requiresVariantSelection: boolean;
  selectVariant: (variantId: string) => void;
};

const ProductVariantPurchaseContext =
  createContext<ProductVariantPurchaseValue | null>(null);

export function ProductVariantPurchaseProvider({
  product,
  children,
}: {
  product: Product;
  children: ReactNode;
}) {
  const purchasableVariants = useMemo(() => getPurchasableVariants(product), [product]);
  const [selectedVariantId, setSelectedVariantId] = useState(
    purchasableVariants.length === 1 ? purchasableVariants[0]?.id ?? "" : ""
  );
  const selectedVariant = product.variants?.find(
    (variant) => variant.id === selectedVariantId
  );
  const requiresVariantSelection = Boolean(product.variants?.length);
  const canPurchase = requiresVariantSelection
    ? Boolean(selectedVariant && isVariantAvailable(selectedVariant))
    : product.availability === "available";

  return (
    <ProductVariantPurchaseContext.Provider
      value={{
        product,
        selectedVariant,
        selectedPrice: selectedVariant
          ? getVariantPrice(product, selectedVariant)
          : product.price,
        canPurchase,
        requiresVariantSelection,
        selectVariant: setSelectedVariantId,
      }}
    >
      {children}
    </ProductVariantPurchaseContext.Provider>
  );
}

export function useProductVariantPurchase() {
  const context = useContext(ProductVariantPurchaseContext);
  if (!context) {
    throw new Error(
      "useProductVariantPurchase must be used inside ProductVariantPurchaseProvider"
    );
  }
  return context;
}

export function ProductVariantPrice() {
  const { product, selectedPrice } = useProductVariantPurchase();
  return (
    <PriceDisplay
      price={selectedPrice}
      retailPrice={product.retailPrice}
      discountRate={getDiscountRate(selectedPrice, product.retailPrice)}
      size="lg"
    />
  );
}

export function ProductVariantSelector() {
  const { product, selectedVariant, selectVariant } = useProductVariantPurchase();

  if (!product.variants?.length) {
    const options = formatProductOptions(product);
    return (
      <div className="mt-5">
        <StaticOptions title={options.sizeLabel} values={options.sizes} />
        <StaticOptions title="색상" values={options.colors} columns />
      </div>
    );
  }

  return (
    <div className="mt-5">
      <p className="mb-2.5 text-[13px] font-semibold text-foreground">색상 / 사이즈</p>
      <div className="grid gap-2">
        {product.variants.map((variant) => {
          const available = isVariantAvailable(variant);
          const selected = selectedVariant?.id === variant.id;
          return (
            <button
              key={variant.id}
              type="button"
              disabled={!available}
              onClick={() => selectVariant(variant.id)}
              className={cn(
                "flex min-h-12 items-center justify-between gap-4 rounded-[14px] border-2 px-4 text-left text-sm transition-colors",
                selected
                  ? "border-foreground bg-background text-foreground"
                  : "border-[#EBEBEB] bg-background text-foreground hover:border-[#B5B5B5] dark:border-border",
                !available &&
                  "cursor-not-allowed border-transparent bg-[#F7F7F7] text-muted-foreground opacity-60 dark:bg-muted"
              )}
            >
              <span className="font-semibold">{getVariantLabel(variant)}</span>
              <span className="text-xs text-[#8B8B8B] dark:text-muted-foreground">
                {!available
                  ? "품절"
                  : variant.surchargeKrw > 0
                    ? `+${variant.surchargeKrw.toLocaleString("ko-KR")}원`
                    : variant.stockStatus === "quantity_managed"
                      ? `재고 ${variant.quantity ?? 0}개`
                      : "구매 가능"}
              </span>
            </button>
          );
        })}
      </div>

      {selectedVariant?.measurements &&
      Object.keys(selectedVariant.measurements).length > 0 ? (
        <div className="mt-2 rounded-[14px] bg-[#F7F7F7] px-4 py-3.5 dark:bg-muted">
          <p className="text-[11px] font-semibold tracking-wide text-[#B0B0B0] dark:text-muted-foreground">
            실측 사이즈 (cm)
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            {Object.entries(selectedVariant.measurements).map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3">
                <dt className="text-[#8B8B8B] dark:text-muted-foreground">{label}</dt>
                <dd className="font-semibold tabular-nums text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

function StaticOptions({
  title,
  values,
  columns = false,
}: {
  title: string;
  values: Array<{ label: string; detail?: string }>;
  columns?: boolean;
}) {
  if (values.length === 0) return null;
  return (
    <div className="mt-5 first:mt-0">
      <p className="mb-2.5 text-[13px] font-semibold text-foreground">{title}</p>
      <div className={cn("grid gap-2", columns && "grid-cols-2")}>
        {values.map((value) => (
          <div
            key={value.label}
            className="flex min-h-11 items-center justify-between rounded-[14px] bg-[#F7F7F7] px-4 text-sm font-semibold text-foreground dark:bg-muted"
          >
            <span>{value.label}</span>
            {value.detail ? (
              <span className="text-xs font-normal text-[#8B8B8B] dark:text-muted-foreground">
                {value.detail}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
