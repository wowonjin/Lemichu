"use client";

import { useMemo, useState } from "react";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/types/product";

const categoryTabs = ["전체", "오늘출고", "백", "워치", "슈즈", "액세서리"] as const;

const priceRanges = [
  { id: "all", label: "전체" },
  { id: "under-200", label: "200만원 이하", max: 2_000_000 },
  { id: "200-500", label: "200–500만원", min: 2_000_000, max: 5_000_000 },
  { id: "over-500", label: "500만원 이상", min: 5_000_000 },
] as const;

type CategoryTab = (typeof categoryTabs)[number];
type PriceRangeId = (typeof priceRanges)[number]["id"];
type DeliveryFilter = Product["deliveryBadge"] | "전체";

const productCategoryById: Record<string, Exclude<CategoryTab, "전체" | "오늘출고">> = {
  "d-001": "백",
  "d-002": "백",
  "d-003": "백",
  "d-004": "백",
  "d-005": "워치",
  "d-006": "백",
  "r-001": "백",
  "r-002": "백",
  "r-003": "백",
  "r-004": "백",
  "r-005": "액세서리",
  "r-006": "백",
  "p-001": "백",
  "p-002": "백",
  "p-003": "백",
  "p-004": "백",
  "p-005": "백",
  "p-006": "백",
  "x-001": "액세서리",
  "x-002": "백",
  "x-003": "백",
  "x-004": "백",
  "x-005": "백",
  "x-006": "액세서리",
};

function matchesCategory(product: Product, category: CategoryTab) {
  if (category === "전체") return true;
  if (category === "오늘출고") return product.deliveryBadge === "오늘출고";
  if (productCategoryById[product.id] === category) return true;

  const text = `${product.brand} ${product.name} ${product.color ?? ""} ${
    product.size ?? ""
  } ${product.badges.join(" ")}`;

  if (category === "백") {
    return ["백", "토트", "숄더", "체인", "플랩", "호보"].some((keyword) =>
      text.includes(keyword)
    );
  }

  if (category === "워치") {
    return ["워치", "시계", "롤렉스", "데이저스트", "오이스터"].some((keyword) =>
      text.includes(keyword)
    );
  }

  if (category === "슈즈") {
    return ["슈즈", "스니커즈", "로퍼", "부츠", "샌들", "슬리퍼"].some((keyword) =>
      text.includes(keyword)
    );
  }

  return ["액세서리", "지갑", "주얼리", "목걸이", "반지", "팔찌"].some((keyword) =>
    text.includes(keyword)
  );
}

function matchesPrice(product: Product, rangeId: PriceRangeId) {
  const range = priceRanges.find((item) => item.id === rangeId);
  if (!range || range.id === "all") return true;
  if ("min" in range && product.price < range.min) return false;
  if ("max" in range && product.price > range.max) return false;
  return true;
}

export function NewArrivalsCatalog({
  products,
  title = "신규입고 상품",
}: {
  products: Product[];
  title?: string;
}) {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("전체");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [brandFilter, setBrandFilter] = useState("전체");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>("전체");
  const [priceRangeId, setPriceRangeId] = useState<PriceRangeId>("all");

  const brandOptions = useMemo(
    () => ["전체", ...Array.from(new Set(products.map((product) => product.brand)))],
    [products]
  );

  const deliveryOptions = useMemo<DeliveryFilter[]>(
    () => ["전체", ...Array.from(new Set(products.map((product) => product.deliveryBadge)))],
    [products]
  );

  const categoryCounts = useMemo(() => {
    return categoryTabs.reduce<Record<CategoryTab, number>>((counts, category) => {
      counts[category] = products.filter((product) => matchesCategory(product, category)).length;
      return counts;
    }, {} as Record<CategoryTab, number>);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!matchesCategory(product, activeCategory)) return false;
      if (brandFilter !== "전체" && product.brand !== brandFilter) return false;
      if (deliveryFilter !== "전체" && product.deliveryBadge !== deliveryFilter) return false;
      return matchesPrice(product, priceRangeId);
    });
  }, [activeCategory, brandFilter, deliveryFilter, priceRangeId, products]);

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

  return (
    <section>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <div className="flex gap-1 overflow-x-auto no-scrollbar md:flex-wrap md:justify-end">
          {categoryTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveCategory(tab);
                resetFilters();
              }}
              className={cn(
                "shrink-0 px-2.5 py-1.5 text-[13px] transition-colors",
                activeCategory === tab
                  ? "border-b-2 border-foreground font-semibold text-foreground"
                  : "text-[#8B8B8B] hover:text-foreground dark:text-muted-foreground"
              )}
            >
              {tab}
              <span
                className={cn(
                  "ml-1 text-[11px] tabular-nums",
                  activeCategory === tab ? "text-foreground/55" : "text-[#B0B0B0] dark:text-muted-foreground"
                )}
              >
                {categoryCounts[tab]}
              </span>
            </button>
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
          {appliedFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={filter.clear}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#F3F3F3] px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-[#E8E8E8] dark:bg-secondary"
            >
              {filter.label}
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
