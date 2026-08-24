"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  CATALOG_FILTERS,
  catalogFilterHref,
  catalogFilterTitle,
  filterCatalogProducts,
  type CatalogFilterId,
} from "@/lib/catalogFilters";
import type { Product } from "@/types/product";

const priceRanges = [
  { id: "all", label: "전체" },
  { id: "under-200", label: "200만원 이하", max: 2_000_000 },
  { id: "200-500", label: "200–500만원", min: 2_000_000, max: 5_000_000 },
  { id: "over-500", label: "500만원 이상", min: 5_000_000 },
] as const;

type PriceRangeId = (typeof priceRanges)[number]["id"];
type DeliveryFilter = Product["deliveryBadge"] | "전체";

function matchesPrice(product: Product, rangeId: PriceRangeId) {
  const range = priceRanges.find((item) => item.id === rangeId);
  if (!range || range.id === "all") return true;
  if ("min" in range && product.price < range.min) return false;
  if ("max" in range && product.price > range.max) return false;
  return true;
}

export function NewArrivalsCatalog({
  products,
  filter = "all",
  title,
}: {
  products: Product[];
  filter?: CatalogFilterId;
  title?: string;
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [brandFilter, setBrandFilter] = useState("전체");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>("전체");
  const [priceRangeId, setPriceRangeId] = useState<PriceRangeId>("all");

  useEffect(() => {
    setBrandFilter("전체");
    setDeliveryFilter("전체");
    setPriceRangeId("all");
    setIsFilterOpen(false);
  }, [filter]);

  const collectionProducts = useMemo(
    () => filterCatalogProducts(products, filter),
    [filter, products]
  );

  const brandOptions = useMemo(
    () => ["전체", ...Array.from(new Set(collectionProducts.map((product) => product.brand)))],
    [collectionProducts]
  );

  const deliveryOptions = useMemo<DeliveryFilter[]>(
    () => ["전체", ...Array.from(new Set(collectionProducts.map((product) => product.deliveryBadge)))],
    [collectionProducts]
  );

  const collectionCounts = useMemo(() => {
    return CATALOG_FILTERS.reduce<Record<CatalogFilterId, number>>((counts, item) => {
      counts[item.id] = filterCatalogProducts(products, item.id).length;
      return counts;
    }, {} as Record<CatalogFilterId, number>);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return collectionProducts.filter((product) => {
      if (brandFilter !== "전체" && product.brand !== brandFilter) return false;
      if (deliveryFilter !== "전체" && product.deliveryBadge !== deliveryFilter) return false;
      return matchesPrice(product, priceRangeId);
    });
  }, [brandFilter, collectionProducts, deliveryFilter, priceRangeId]);

  const activeFilterCount = [
    brandFilter !== "전체",
    deliveryFilter !== "전체",
    priceRangeId !== "all",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setBrandFilter("전체");
    setDeliveryFilter("전체");
    setPriceRangeId("all");
  };

  const selectedPriceLabel =
    priceRanges.find((range) => range.id === priceRangeId)?.label ?? "전체";

  const appliedFilters = [
    brandFilter !== "전체" ? { key: "brand", label: brandFilter, clear: () => setBrandFilter("전체") } : null,
    deliveryFilter !== "전체"
      ? { key: "delivery", label: deliveryFilter, clear: () => setDeliveryFilter("전체") }
      : null,
    priceRangeId !== "all"
      ? { key: "price", label: selectedPriceLabel, clear: () => setPriceRangeId("all") }
      : null,
  ].filter((item): item is { key: string; label: string; clear: () => void } => Boolean(item));

  const heading = title ?? catalogFilterTitle(filter);

  return (
    <section>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{heading}</h2>
        <div className="flex gap-1 overflow-x-auto no-scrollbar md:flex-wrap md:justify-end">
          {CATALOG_FILTERS.map((item) => (
            <Link
              key={item.id}
              href={catalogFilterHref(item.id)}
              className={cn(
                "shrink-0 px-2.5 py-1.5 text-[13px] transition-colors",
                filter === item.id
                  ? "border-b-2 border-foreground font-semibold text-foreground"
                  : "text-[#8B8B8B] hover:text-foreground dark:text-muted-foreground"
              )}
            >
              {item.label}
              <span
                className={cn(
                  "ml-1 text-[11px] tabular-nums",
                  filter === item.id ? "text-foreground/55" : "text-[#B0B0B0] dark:text-muted-foreground"
                )}
              >
                {collectionCounts[item.id]}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-[#8B8B8B] dark:text-muted-foreground">
          총 <span className="font-medium text-foreground">{filteredProducts.length}</span>개 상품
        </p>
        <button
          type="button"
          aria-expanded={isFilterOpen}
          onClick={() => setIsFilterOpen((current) => !current)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold transition-colors",
            isFilterOpen || activeFilterCount > 0
              ? "border-foreground bg-foreground text-background"
              : "border-[#E5E5E5] bg-background text-foreground hover:border-foreground dark:border-border"
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          필터
          {activeFilterCount > 0 ? (
            <span
              className={cn(
                "grid size-4 place-items-center rounded-full text-[10px] font-bold leading-none",
                isFilterOpen || activeFilterCount > 0
                  ? "bg-background text-foreground"
                  : "bg-foreground text-background"
              )}
            >
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {isFilterOpen ? (
        <div className="mt-3 overflow-hidden rounded-md border border-[#E8E8E8] bg-[#FAFAFA] dark:border-border dark:bg-muted">
          <FilterRow title="브랜드">
            {brandOptions.map((brand) => (
              <FilterChip
                key={brand}
                selected={brandFilter === brand}
                onClick={() => setBrandFilter(brand)}
              >
                {brand}
              </FilterChip>
            ))}
          </FilterRow>
          <FilterRow title="배송">
            {deliveryOptions.map((delivery) => (
              <FilterChip
                key={delivery}
                selected={deliveryFilter === delivery}
                onClick={() => setDeliveryFilter(delivery)}
              >
                {delivery}
              </FilterChip>
            ))}
          </FilterRow>
          <FilterRow title="가격" last>
            {priceRanges.map((range) => (
              <FilterChip
                key={range.id}
                selected={priceRangeId === range.id}
                onClick={() => setPriceRangeId(range.id)}
              >
                {range.label}
              </FilterChip>
            ))}
          </FilterRow>
          <div className="flex items-center justify-end border-t border-[#E8E8E8] px-4 py-3 dark:border-border">
            <button
              type="button"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
              className="inline-flex h-8 items-center gap-1.5 text-[13px] font-medium text-[#6B6B6B] transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40 dark:text-muted-foreground"
            >
              <RotateCcw className="size-3.5" />
              초기화
            </button>
          </div>
        </div>
      ) : null}

      {appliedFilters.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {appliedFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.clear}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#F3F3F3] px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-[#E8E8E8] dark:bg-secondary"
            >
              {item.label}
              <X className="size-3 text-[#8B8B8B]" />
              <span className="sr-only"> 조건 해제</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        {filteredProducts.length > 0 ? (
          <ProductGrid
            products={filteredProducts}
            cardClassName="[&_span]:rounded-none"
            imageClassName="rounded-none border-transparent bg-transparent"
            hideAuthenticationBadge
            hiddenBadges={["희소상품"]}
          />
        ) : (
          <div className="grid min-h-52 place-items-center rounded-md border border-dashed border-border px-6 text-center">
            <div>
              <p className="text-sm font-medium text-foreground">조건에 맞는 상품이 없습니다.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 text-[13px] font-semibold text-foreground underline-offset-4 hover:underline"
              >
                필터 초기화
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterRow({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 px-4 py-4 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-start",
        !last && "border-b border-[#E8E8E8] dark:border-border"
      )}
    >
      <p className="pt-1 text-[13px] font-semibold tracking-tight text-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center rounded-md border px-3 text-[13px] font-medium transition-colors",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-[#E5E5E5] bg-background text-[#555] hover:border-foreground hover:text-foreground dark:border-border dark:bg-background dark:text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}
