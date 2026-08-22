"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/types/product";

const categoryTabs = ["전체", "오늘출고", "백", "워치", "슈즈", "액세서리"] as const;

const priceRanges = [
  { id: "all", label: "전체" },
  { id: "under-200", label: "200만원 이하", max: 2_000_000 },
  { id: "200-500", label: "200만원-500만원", min: 2_000_000, max: 5_000_000 },
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

  return (
    <section>
      <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {categoryTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveCategory(tab);
                setBrandFilter("전체");
                setDeliveryFilter("전체");
                setPriceRangeId("all");
              }}
              className={cn(
                "pb-1 transition-colors hover:text-foreground",
                activeCategory === tab
                  ? "border-b border-foreground font-semibold text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {tab}
              <span className="ml-1 text-xs text-muted-foreground">
                {categoryCounts[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>총 {filteredProducts.length}개 상품</span>
        <button
          type="button"
          aria-expanded={isFilterOpen}
          onClick={() => setIsFilterOpen((current) => !current)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1.5 font-semibold text-foreground transition-colors hover:text-muted-foreground",
            activeFilterCount > 0 && "text-foreground"
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          필터{activeFilterCount > 0 ? ` ${activeFilterCount}` : ""}
        </button>
      </div>

      {isFilterOpen ? (
        <div className="mb-8 grid gap-5 border-y border-border py-5 text-sm md:grid-cols-3">
          <FilterGroup title="브랜드">
            {brandOptions.map((brand) => (
              <FilterChip
                key={brand}
                selected={brandFilter === brand}
                onClick={() => setBrandFilter(brand)}
              >
                {brand}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup title="배송">
            {deliveryOptions.map((delivery) => (
              <FilterChip
                key={delivery}
                selected={deliveryFilter === delivery}
                onClick={() => setDeliveryFilter(delivery)}
              >
                {delivery}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup title="가격">
            {priceRanges.map((range) => (
              <FilterChip
                key={range.id}
                selected={priceRangeId === range.id}
                onClick={() => setPriceRangeId(range.id)}
              >
                {range.label}
              </FilterChip>
            ))}
          </FilterGroup>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              필터 초기화
            </button>
          </div>
        </div>
      ) : null}

      {filteredProducts.length > 0 ? (
        <ProductGrid
          products={filteredProducts}
          cardClassName="[&_span]:rounded-none"
          imageClassName="rounded-none border-transparent bg-transparent"
          hideAuthenticationBadge
          hiddenBadges={["희소상품"]}
        />
      ) : (
        <div className="grid min-h-52 place-items-center border border-dashed border-border text-sm text-muted-foreground">
          조건에 맞는 상품이 없습니다.
        </div>
      )}
    </section>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 font-semibold text-foreground">{title}</p>
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
      onClick={onClick}
      className={cn(
        "border px-3 py-1.5 transition-colors",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
