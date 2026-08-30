"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { useMemberPoints } from "@/hooks/useMemberPoints";
import { cn } from "@/lib/cn";
import { getDiscountRate } from "@/lib/formatPrice";
import { formatProductOptions } from "@/lib/productOptions";
import {
  findVariantByOptions,
  formatVariantMeasurements,
  getPurchasableVariants,
  getUniqueVariantColors,
  getUniqueVariantSizes,
  getVariantColorLabel,
  getVariantPrice,
  getVariantSizeLabel,
  isVariantAvailable,
} from "@/lib/product-variants";
import { resolvePurchasePoints, type TossCheckoutMethod } from "@/lib/points";
import type { Product, ProductVariant } from "@/types/product";

type ProductVariantPurchaseValue = {
  product: Product;
  selectedVariant?: ProductVariant;
  selectedPrice: number;
  availablePoints: number;
  usePoints: boolean;
  pointsToUse: number;
  payablePrice: number;
  expectedEarn: number;
  canPurchase: boolean;
  requiresVariantSelection: boolean;
  paymentMethod: TossCheckoutMethod;
  selectVariant: (variantId: string) => void;
  selectPaymentMethod: (method: TossCheckoutMethod) => void;
  toggleUsePoints: () => void;
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
    purchasableVariants[0]?.id ?? ""
  );
  const [paymentMethod, setPaymentMethod] = useState<TossCheckoutMethod>("TRANSFER");
  const [usePoints, setUsePoints] = useState(false);
  const availablePoints = useMemberPoints();
  const selectedVariant = product.variants?.find(
    (variant) => variant.id === selectedVariantId
  );
  const selectedPrice = selectedVariant
    ? getVariantPrice(product, selectedVariant)
    : product.price;
  const { pointsToUse, payablePrice, expectedEarn } = resolvePurchasePoints({
    productTotal: selectedPrice,
    availablePoints,
    usePoints,
    method: paymentMethod,
  });
  const requiresVariantSelection = Boolean(product.variants?.length);
  const canPurchase = requiresVariantSelection
    ? Boolean(selectedVariant && isVariantAvailable(selectedVariant))
    : product.availability === "available";

  return (
    <ProductVariantPurchaseContext.Provider
      value={{
        product,
        selectedVariant,
        selectedPrice,
        availablePoints,
        usePoints,
        pointsToUse,
        payablePrice,
        expectedEarn,
        canPurchase,
        requiresVariantSelection,
        paymentMethod,
        selectVariant: setSelectedVariantId,
        selectPaymentMethod: setPaymentMethod,
        toggleUsePoints: () => setUsePoints((current) => !current),
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
  const { product } = useProductVariantPurchase();
  const options = formatProductOptions(product);

  if (!product.variants?.length) {
    return (
      <div className="divide-y divide-[#E8E8E8] dark:divide-border">
        <StaticOptions title="색상" values={options.colors} />
        <StaticOptions
          title={options.sizeLabel}
          values={options.sizes}
          caption={
            options.sizeGuide.length === 1 && /\d/.test(options.sizeGuide[0].detail ?? "")
              ? options.sizeGuide[0].detail
              : undefined
          }
        />
      </div>
    );
  }

  return <VariantOptionPicker variants={product.variants} sizeLabel={options.sizeLabel} />;
}

function VariantOptionPicker({
  variants,
  sizeLabel,
}: {
  variants: ProductVariant[];
  sizeLabel: string;
}) {
  const { selectedVariant, selectVariant } = useProductVariantPurchase();
  const colors = getUniqueVariantColors(variants);
  const [selectedColor, setSelectedColor] = useState(() => {
    if (selectedVariant) return getVariantColorLabel(selectedVariant);
    return (
      colors.find((color) =>
        variants.some(
          (variant) => getVariantColorLabel(variant) === color && isVariantAvailable(variant)
        )
      ) ??
      colors[0] ??
      ""
    );
  });

  const sizes = useMemo(
    () =>
      getUniqueVariantSizes(
        variants.filter((variant) => getVariantColorLabel(variant) === selectedColor)
      ),
    [selectedColor, variants]
  );

  const selectMatchingVariant = (color: string, size?: string) => {
    if (size) {
      const matched = findVariantByOptions(variants, color, size);
      if (matched && isVariantAvailable(matched)) {
        selectVariant(matched.id);
        return;
      }
    }

    const availableForColor = variants.filter(
      (variant) => getVariantColorLabel(variant) === color && isVariantAvailable(variant)
    );
    if (availableForColor.length === 1) {
      selectVariant(availableForColor[0].id);
      return;
    }

    selectVariant("");
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    selectMatchingVariant(
      color,
      selectedVariant ? getVariantSizeLabel(selectedVariant) : undefined
    );
  };

  const handleSizeSelect = (size: string) => {
    const matched = findVariantByOptions(variants, selectedColor, size);
    if (matched && isVariantAvailable(matched)) {
      selectVariant(matched.id);
    }
  };

  const selectedSize = selectedVariant ? getVariantSizeLabel(selectedVariant) : "";
  const showColorPicker = colors.length > 1;
  const showSizePicker = sizes.length > 1;
  const measurementText = formatVariantMeasurements(selectedVariant);

  return (
    <div className="divide-y divide-[#E8E8E8] dark:divide-border">
      <OptionGroup title="색상" selectedLabel={selectedColor || undefined} placeholder="선택">
        {showColorPicker ? (
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const available = variants.some(
                (variant) =>
                  getVariantColorLabel(variant) === color && isVariantAvailable(variant)
              );
              return (
                <OptionChip
                  key={color}
                  label={color}
                  selected={selectedColor === color}
                  soldOut={!available}
                  shape="pill"
                  onClick={() => handleColorSelect(color)}
                />
              );
            })}
          </div>
        ) : null}
      </OptionGroup>

      <OptionGroup
        title={sizeLabel}
        selectedLabel={selectedSize || undefined}
        placeholder="선택"
        caption={measurementText || undefined}
      >
        {showSizePicker ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {sizes.map((size) => {
              const variant = findVariantByOptions(variants, selectedColor, size);
              const available = Boolean(variant && isVariantAvailable(variant));
              return (
                <OptionChip
                  key={size}
                  label={size}
                  selected={selectedVariant?.id === variant?.id}
                  soldOut={!available}
                  disabled={!available}
                  detail={
                    available && variant && variant.surchargeKrw > 0
                      ? `+${variant.surchargeKrw.toLocaleString("ko-KR")}`
                      : undefined
                  }
                  onClick={() => handleSizeSelect(size)}
                />
              );
            })}
          </div>
        ) : null}
      </OptionGroup>

      {selectedVariant &&
      (selectedVariant.surchargeKrw > 0 ||
        selectedVariant.stockStatus === "quantity_managed") ? (
        <p className="pt-3 text-[12px] text-[#8B8B8B] dark:text-muted-foreground">
          {selectedVariant.surchargeKrw > 0
            ? `옵션 추가금 +${selectedVariant.surchargeKrw.toLocaleString("ko-KR")}원`
            : `재고 ${selectedVariant.quantity ?? 0}개`}
        </p>
      ) : null}
    </div>
  );
}

function OptionGroup({
  title,
  selectedLabel,
  placeholder,
  caption,
  children,
}: {
  title: string;
  selectedLabel?: string;
  placeholder?: string;
  caption?: string;
  children?: ReactNode;
}) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-4">
        <p className="shrink-0 text-[13px] text-[#8B8B8B] dark:text-muted-foreground">{title}</p>
        <p
          className={cn(
            "min-w-0 text-right text-[13px]",
            selectedLabel
              ? "font-medium text-foreground"
              : "text-[#B0B0B0] dark:text-muted-foreground"
          )}
        >
          {selectedLabel ?? placeholder}
        </p>
      </div>
      {caption ? (
        <p className="mt-1 text-right text-[12px] leading-5 text-[#8B8B8B] dark:text-muted-foreground">
          {caption}
        </p>
      ) : null}
      {children ? <div className="mt-2.5">{children}</div> : null}
    </div>
  );
}

function OptionChip({
  label,
  selected,
  soldOut = false,
  disabled = false,
  detail,
  shape = "box",
  onClick,
}: {
  label: string;
  selected: boolean;
  soldOut?: boolean;
  disabled?: boolean;
  detail?: string;
  shape?: "box" | "pill";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${label}${soldOut ? " 품절" : ""}`}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 flex-col items-center justify-center border-2 px-3 text-[13px] font-semibold transition-colors",
        shape === "pill" ? "rounded-md px-4" : "w-full rounded-md tabular-nums",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-[#EBEBEB] bg-background text-foreground hover:border-[#B5B5B5] dark:border-border",
        soldOut &&
          !selected &&
          "border-transparent bg-[#F7F7F7] text-[#C4C4C4] hover:border-transparent dark:bg-muted dark:text-muted-foreground",
        soldOut && shape === "box" && "line-through",
        disabled && "cursor-not-allowed"
      )}
    >
      <span className="leading-tight">{label}</span>
      {detail ? (
        <span
          className={cn(
            "mt-0.5 text-[10px] font-medium leading-none no-underline",
            selected ? "text-background/70" : "text-[#8B8B8B] dark:text-muted-foreground"
          )}
        >
          {detail}
        </span>
      ) : null}
    </button>
  );
}

function StaticOptions({
  title,
  values,
  caption,
}: {
  title: string;
  values: Array<{ label: string; detail?: string }>;
  caption?: string;
}) {
  if (values.length === 0) return null;
  const single = values.length === 1;
  return (
    <OptionGroup
      title={title}
      selectedLabel={single ? values[0].label : undefined}
      caption={single && values[0].detail === "품절" ? "품절" : caption}
    >
      {single ? null : (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <div
              key={value.label}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#EBEBEB] bg-background px-4 text-[13px] font-semibold text-foreground dark:border-border"
            >
              <span>{value.label}</span>
              {value.detail ? (
                <span className="text-[11px] font-normal text-[#8B8B8B] dark:text-muted-foreground">
                  {value.detail}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </OptionGroup>
  );
}
