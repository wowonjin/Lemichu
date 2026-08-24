"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Heart, ShieldCheck, SlidersHorizontal, Truck } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { useToast } from "@/components/ui/toast";
import { Sheet } from "@/components/ui/sheet";
import { WishlistToggleButton } from "@/components/product/WishlistToggleButton";
import { getLoginHref } from "@/lib/redirect";
import { getPlaceholderGradient, isRealImage } from "@/lib/placeholder";
import { cn } from "@/lib/cn";
import {
  PRICE_ALERT_PUSH_CONNECTED,
  getProductAvailability,
  getWishlistInsight,
  type WishlistAlertPrefs,
  type WishlistRecord,
} from "@/lib/wishlist";
import {
  countWishlistTabs,
  EMPTY_WISHLIST_QUERY,
  filterWishlistEntries,
  getActiveWishlistFilterChips,
  parseWishlistQuery,
  sortWishlistEntries,
  wishlistQueryToSearchParams,
  WISHLIST_SORT_LABELS,
  WISHLIST_SORTS,
  WISHLIST_TAB_LABELS,
  WISHLIST_TABS,
  type WishlistEntry,
  type WishlistQueryState,
  type WishlistTab,
} from "@/lib/wishlistQuery";
import type { Product } from "@/types/product";

const formatWon = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export function WishlistCatalog({ products }: { products: Product[] }) {
  const { user, ready } = useAuthUser();
  const pathname = usePathname() ?? "/wishlist";

  if (!ready) {
    return (
      <WishlistShell>
        <WishlistPulse />
      </WishlistShell>
    );
  }

  if (!user) {
    return (
      <WishlistShell>
        <WishlistHero
          count={0}
          subtitle="로그인하면 관심 상품의 가격과 배송 변화를 확인할 수 있습니다."
        />
        <section className="mt-8 rounded-md bg-white px-6 py-20 text-center dark:bg-[#1C1C1E]">
          <span className="mx-auto grid size-16 place-items-center rounded-md bg-[#F5F5F7] dark:bg-[#2C2C2E]">
            <Heart className="size-7 text-[#6E6E73]" strokeWidth={1.5} />
          </span>
          <h2 className="mt-6 text-[28px] font-semibold tracking-[-0.03em]">
            로그인하고 찜한 상품을 확인하세요.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#6E6E73] dark:text-[#A1A1A6]">
            저장한 상품의 가격 변동과 출고 상태를 한곳에서 볼 수 있습니다.
          </p>
          <Link
            href={getLoginHref(pathname)}
            className="mt-7 inline-flex h-12 items-center justify-center rounded-md bg-[#0071E3] px-7 text-[17px] text-white transition-colors hover:bg-[#0077ED]"
          >
            로그인하기
          </Link>
        </section>
      </WishlistShell>
    );
  }

  return <WishlistCatalogBody products={products} />;
}

function WishlistCatalogBody({ products }: { products: Product[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { records, status, error, retry, remove, restore, removeMany, updateAlerts, getRecord } =
    useWishlist();
  const { toast } = useToast();
  const [query, setQuery] = useState<WishlistQueryState>(() =>
    parseWishlistQuery(new URLSearchParams(searchParams.toString()))
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setQuery(parseWishlistQuery(new URLSearchParams(searchParams.toString())));
  }, [searchParams]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const replaceQuery = (next: WishlistQueryState) => {
    setQuery(next);
    const params = wishlistQueryToSearchParams(next);
    const qs = params.toString();
    router.replace(qs ? `/wishlist?${qs}` : "/wishlist", { scroll: false });
  };

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const entries = useMemo<WishlistEntry[]>(
    () =>
      records
        .map((record) => {
          const product = productById.get(record.productId);
          return product ? { product, record } : null;
        })
        .filter((item): item is WishlistEntry => Boolean(item)),
    [productById, records]
  );

  const missingRecords = records.filter((record) => !productById.has(record.productId));
  const tabCounts = countWishlistTabs(entries);
  const filtered = sortWishlistEntries(filterWishlistEntries(entries, query), query.sort);
  const chips = getActiveWishlistFilterChips(query);
  const suggestions = useMemo(() => {
    const wished = new Set(records.map((record) => record.productId));
    return products.filter((product) => !wished.has(product.id)).slice(0, 4);
  }, [products, records]);

  const handleUnwish = async (product: Product) => {
    try {
      const snapshot = await remove(product.id);
      if (!snapshot) return;
      toast("찜 목록에서 삭제했어요", {
        label: "되돌리기",
        onClick: () => {
          restore(snapshot).catch(() => {
            toast("되돌리기에 실패했어요.");
          });
        },
      });
    } catch {
      toast("찜 해제에 실패했어요. 목록을 복원했습니다.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const removed = await removeMany(selectedIds);
      setSelectedIds([]);
      toast(`찜 목록에서 ${removed.length}개를 삭제했어요`, {
        label: "되돌리기",
        onClick: () => {
          Promise.all(removed.map((record) => restore(record))).catch(() => {
            toast("되돌리기에 실패했어요.");
          });
        },
      });
    } catch {
      toast("선택 삭제에 실패했어요. 목록을 복원했습니다.");
    }
  };

  if (status === "loading") {
    return (
      <WishlistShell>
        <WishlistPulse />
      </WishlistShell>
    );
  }

  if (status === "error") {
    return (
      <WishlistShell>
        <WishlistHero count={0} subtitle="목록을 불러오지 못했습니다." />
        <section className="mt-8 rounded-md bg-white px-6 py-20 text-center dark:bg-[#1C1C1E]">
          <p className="text-[17px] text-[#6E6E73] dark:text-[#A1A1A6]">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-[#0071E3] px-7 text-[17px] text-white transition-colors hover:bg-[#0077ED]"
          >
            다시 시도
          </button>
        </section>
      </WishlistShell>
    );
  }

  return (
    <WishlistShell>
      <WishlistHero
        count={records.length}
        subtitle={
          records.length === 0
            ? "관심 있는 상품을 저장하면 가격과 배송 변화를 모아볼 수 있습니다."
            : `${records.length}개의 상품을 저장했습니다. 가격과 배송이 바뀌면 알려드립니다.`
        }
        action={
          records.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setEditMode((value) => !value);
                setSelectedIds([]);
              }}
              className="text-[17px] font-medium text-[#0071E3] transition-colors hover:text-[#0077ED]"
            >
              {editMode ? "완료" : "편집"}
            </button>
          ) : (
            <Link
              href="/new-arrivals"
              className="text-[17px] font-medium text-[#0071E3] transition-colors hover:text-[#0077ED]"
            >
              쇼핑 계속하기
            </Link>
          )
        }
      />

      {records.length > 0 ? (
        <>
          <div
            className="mt-8 flex gap-2 overflow-x-auto no-scrollbar rounded-md bg-white p-1.5 dark:bg-[#1C1C1E]"
            role="tablist"
          >
            {WISHLIST_TABS.map((tab) => {
              const count = tabCounts[tab];
              const disabled = tab !== "all" && count === 0;
              const selected = query.tab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  disabled={disabled}
                  onClick={() => replaceQuery({ ...query, tab })}
                  className={cn(
                    "shrink-0 rounded-md px-4 py-2.5 text-[14px] transition-colors",
                    disabled
                      ? "cursor-not-allowed text-[#6E6E73]/40"
                      : selected
                        ? "bg-[#F5F5F7] font-semibold text-[#1D1D1F] dark:bg-[#2C2C2E] dark:text-white"
                        : "text-[#6E6E73] hover:text-[#1D1D1F] dark:hover:text-white"
                  )}
                >
                  {WISHLIST_TAB_LABELS[tab]}
                  <span className="ml-1 text-[12px] text-[#6E6E73] dark:text-[#A1A1A6]">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-[#6E6E73] dark:text-[#A1A1A6]">
              <span>결과 {filtered.length}개</span>
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() =>
                    replaceQuery({
                      ...query,
                      [chip.key]: chip.key === "priceDrop" ? false : "",
                    })
                  }
                  className="inline-flex h-8 items-center rounded-md bg-white px-3 text-[12px] text-[#1D1D1F] dark:bg-[#1C1C1E] dark:text-[#F5F5F7]"
                >
                  {chip.label} ×
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="wishlist-sort">
                정렬
              </label>
              <select
                id="wishlist-sort"
                value={query.sort}
                onChange={(event) =>
                  replaceQuery({ ...query, sort: event.target.value as WishlistQueryState["sort"] })
                }
                className="h-11 rounded-md bg-white px-4 text-[14px] text-[#1D1D1F] outline-none dark:bg-[#1C1C1E] dark:text-[#F5F5F7]"
              >
                {WISHLIST_SORTS.map((sort) => (
                  <option key={sort} value={sort}>
                    {WISHLIST_SORT_LABELS[sort]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="inline-flex h-11 items-center gap-1.5 rounded-md bg-white px-4 text-[14px] font-medium dark:bg-[#1C1C1E]"
              >
                <SlidersHorizontal className="size-4" />
                필터{chips.length > 0 ? ` ${chips.length}` : ""}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {records.length === 0 ? (
        <section className="mt-8 rounded-md bg-white px-6 py-20 text-center dark:bg-[#1C1C1E]">
          <span className="mx-auto grid size-16 place-items-center rounded-md bg-[#F5F5F7] dark:bg-[#2C2C2E]">
            <Heart className="size-7 text-[#6E6E73]" strokeWidth={1.5} />
          </span>
          <h2 className="mt-6 text-[28px] font-semibold tracking-[-0.03em]">
            찜한 상품이 없습니다.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#6E6E73] dark:text-[#A1A1A6]">
            관심 있는 상품을 저장하면 가격 변동과 출고 상태를 한곳에서 확인할 수 있습니다.
          </p>
          <Link
            href="/ranking"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-md bg-[#0071E3] px-7 text-[17px] text-white transition-colors hover:bg-[#0077ED]"
          >
            인기 상품 둘러보기
          </Link>
        </section>
      ) : filtered.length === 0 ? (
        <section className="mt-8 rounded-md bg-white px-6 py-20 text-center dark:bg-[#1C1C1E]">
          <h2 className="text-[28px] font-semibold tracking-[-0.03em]">
            조건에 맞는 상품이 없습니다.
          </h2>
          <button
            type="button"
            onClick={() => replaceQuery({ ...EMPTY_WISHLIST_QUERY, tab: query.tab })}
            className="mt-7 inline-flex h-12 items-center justify-center rounded-md bg-[#0071E3] px-7 text-[17px] text-white transition-colors hover:bg-[#0077ED]"
          >
            필터 초기화
          </button>
        </section>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {filtered.map((entry) => (
            <AppleWishlistCard
              key={entry.product.id}
              product={entry.product}
              record={entry.record}
              editMode={editMode}
              selected={selectedIds.includes(entry.product.id)}
              onSelect={() =>
                setSelectedIds((current) =>
                  current.includes(entry.product.id)
                    ? current.filter((id) => id !== entry.product.id)
                    : [...current, entry.product.id]
                )
              }
              onUnwish={handleUnwish}
            />
          ))}
        </div>
      )}

      {missingRecords.length > 0 ? (
        <ul className="mt-6 divide-y divide-[#D2D2D7]/70 overflow-hidden rounded-md bg-white dark:divide-[#424245] dark:bg-[#1C1C1E]">
          {missingRecords.map((record) => (
            <li key={record.productId} className="flex items-center justify-between gap-4 px-5 py-4">
              <p className="text-[14px] text-[#6E6E73] dark:text-[#A1A1A6]">
                상품 정보를 불러오지 못했어요. ({record.productId})
              </p>
              <button
                type="button"
                onClick={() => handleUnwish({ id: record.productId } as Product)}
                className="text-[14px] text-[#0071E3] hover:text-[#0077ED]"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {editMode && records.length > 0 ? (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-black/5 bg-white/90 px-5 py-3 backdrop-blur-xl md:static md:mt-8 md:rounded-md md:border-0 md:bg-white md:px-6 md:py-4 dark:border-white/10 dark:bg-[#1C1C1E]/90 md:dark:bg-[#1C1C1E]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] font-medium">{selectedIds.length}개 선택</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setSelectedIds(
                    selectedIds.length === filtered.length
                      ? []
                      : filtered.map((entry) => entry.product.id)
                  )
                }
                className="h-11 rounded-md px-4 text-[14px] text-[#0071E3] hover:text-[#0077ED]"
              >
                전체 선택
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="h-11 rounded-md px-4 text-[14px] text-[#0071E3] hover:text-[#0077ED]"
              >
                선택 삭제
              </button>
              <button
                type="button"
                onClick={() => setAlertOpen(true)}
                className="h-11 rounded-md bg-[#0071E3] px-5 text-[14px] text-white hover:bg-[#0077ED]"
              >
                가격 알림 설정
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <TrustCard
          icon={Bell}
          title="가격 알림"
          description="찜한 상품의 가격이 내리면 설정한 조건으로 확인할 수 있습니다."
        />
        <TrustCard
          icon={ShieldCheck}
          title="정품 검수"
          description="저장한 상품도 출고 전 진위와 상태를 다시 확인합니다."
        />
        <TrustCard
          icon={Truck}
          title="빠른 출고"
          description="오늘출고 상품은 결제 후 검수센터에서 바로 준비합니다."
        />
      </section>

      {suggestions.length > 0 && records.length === 0 ? (
        <SuggestionRail products={suggestions} />
      ) : null}

      <p className="mt-14 text-center text-[13px] text-[#6E6E73] dark:text-[#A1A1A6]">
        도움이 필요하신가요?{" "}
        <Link href="/faq" className="text-[#0071E3] hover:text-[#0077ED]">
          고객센터
        </Link>
        에서 찜과 알림을 안내합니다.
      </p>

      <Sheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="필터"
        side={isDesktop ? "right" : "bottom"}
      >
        <FilterPanel
          query={query}
          entries={entries}
          onChange={replaceQuery}
          onClose={() => setFilterOpen(false)}
        />
      </Sheet>

      <Sheet
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="가격 알림 설정"
        side={isDesktop ? "right" : "bottom"}
      >
        <AlertPanel
          selectedIds={selectedIds}
          getRecord={getRecord}
          onSave={async (productId, alerts) => {
            await updateAlerts(productId, alerts);
          }}
          onClose={() => setAlertOpen(false)}
        />
      </Sheet>
    </WishlistShell>
  );
}

function WishlistShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#F5F5F7] font-sans text-[#1D1D1F] dark:bg-black dark:text-[#F5F5F7]">
      <div className="mx-auto max-w-[1040px] px-5 pb-36 pt-10 md:px-8 md:pb-24 md:pt-16">
        {children}
      </div>
    </div>
  );
}

function WishlistHero({
  count,
  subtitle,
  action,
}: {
  count: number;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] md:text-[56px]">
          찜한 상품.
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#6E6E73] md:text-[19px] dark:text-[#A1A1A6]">
          {subtitle}
        </p>
        {count > 0 ? (
          <p className="mt-2 text-[13px] text-[#6E6E73] dark:text-[#A1A1A6]">{count}개 저장됨</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

function WishlistPulse() {
  return (
    <>
      <div className="h-14 w-56 animate-pulse rounded-2xl bg-white dark:bg-[#1C1C1E]" />
      <div className="mt-4 h-6 w-80 max-w-full animate-pulse rounded-xl bg-white dark:bg-[#1C1C1E]" />
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[3/4] animate-pulse rounded-md bg-white dark:bg-[#1C1C1E]"
          />
        ))}
      </div>
    </>
  );
}

function AppleWishlistCard({
  product,
  record,
  editMode,
  selected,
  onSelect,
  onUnwish,
}: {
  product: Product;
  record: WishlistRecord;
  editMode: boolean;
  selected: boolean;
  onSelect: () => void;
  onUnwish: (product: Product) => Promise<void> | void;
}) {
  const insight = getWishlistInsight(product, record);
  const availability = getProductAvailability(product);
  const unavailable = availability !== "available";
  const dropped = record.priceAtAdd > product.price;

  return (
    <article className="group relative overflow-hidden rounded-md bg-white p-4 transition-transform duration-300 hover:-translate-y-0.5 dark:bg-[#1C1C1E]">
      <Link href={product.href} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#F5F5F7] dark:bg-[#2C2C2E]">
          {isRealImage(product.imageUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={`${product.brand} ${product.name}`}
              className="h-full w-full object-cover mix-blend-multiply dark:mix-blend-normal"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ backgroundImage: getPlaceholderGradient(product.id) }}
            />
          )}
          {unavailable ? (
            <div className="absolute inset-0 grid place-items-center bg-white/70 dark:bg-black/55">
              <span className="rounded-md bg-[#1D1D1F] px-3 py-1 text-[12px] text-white">
                {availability === "sold" ? "판매 완료" : "품절"}
              </span>
            </div>
          ) : null}
        </div>
        <p className="mt-3 text-[12px] text-[#6E6E73] dark:text-[#A1A1A6]">{product.brand}</p>
        <h3 className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug tracking-[-0.01em]">
          {product.name}
        </h3>
        <p className="mt-2 text-[15px] font-semibold tabular-nums">{formatWon(product.price)}</p>
        {dropped ? (
          <p className="mt-1 text-[12px] text-[#6E6E73] line-through tabular-nums dark:text-[#A1A1A6]">
            {formatWon(record.priceAtAdd)}
          </p>
        ) : product.retailPrice ? (
          <p className="mt-1 text-[12px] text-[#6E6E73] line-through tabular-nums dark:text-[#A1A1A6]">
            {formatWon(product.retailPrice)}
          </p>
        ) : null}
        {insight ? (
          <p
            className={cn(
              "mt-2 text-[12px]",
              insight.kind === "price-drop" ? "font-medium text-[#068441]" : "text-[#6E6E73] dark:text-[#A1A1A6]"
            )}
          >
            {insight.label}
          </p>
        ) : (
          <p className="mt-2 text-[12px] text-[#6E6E73] dark:text-[#A1A1A6]">
            {product.deliveryBadge}
          </p>
        )}
      </Link>

      {unavailable ? (
        <Link
          href={`/search?q=${encodeURIComponent(product.brand)}`}
          className="mt-3 inline-flex text-[13px] font-medium text-[#0071E3] hover:text-[#0077ED]"
        >
          비슷한 상품 보기
        </Link>
      ) : null}

      {editMode ? (
        <button
          type="button"
          onClick={onSelect}
          aria-label={`${product.brand} ${product.name} 선택`}
          className="absolute left-6 top-6 z-10"
        >
          <span
            className={cn(
              "grid size-[22px] place-items-center rounded-md border transition-colors",
              selected
                ? "border-[#0071E3] bg-[#0071E3] text-white"
                : "border-[#D2D2D7] bg-white text-transparent dark:border-[#636366] dark:bg-[#1C1C1E]"
            )}
          >
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
              <path
                d="M3.5 8.2 6.4 11l6.1-6.4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      ) : (
        <WishlistToggleButton
          product={product}
          onUnwish={onUnwish}
          className="absolute right-5 top-5 z-10 size-10 rounded-md bg-white/90 text-[#1D1D1F] shadow-sm backdrop-blur dark:bg-[#1C1C1E]/90 dark:text-white"
        />
      )}
    </article>
  );
}

function SuggestionRail({ products }: { products: Product[] }) {
  return (
    <section className="mt-14">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-[28px] font-semibold tracking-[-0.03em] md:text-[32px]">
          함께 보면 좋은 상품.
        </h2>
        <Link
          href="/new-arrivals"
          className="shrink-0 text-[14px] font-medium text-[#0071E3] hover:text-[#0077ED]"
        >
          더 보기
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={product.href}
            className="group overflow-hidden rounded-md bg-white p-4 transition-transform duration-300 hover:-translate-y-0.5 dark:bg-[#1C1C1E]"
          >
            <div className="relative aspect-square overflow-hidden bg-[#F5F5F7] dark:bg-[#2C2C2E]">
              {isRealImage(product.imageUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={`${product.brand} ${product.name}`}
                  className="h-full w-full object-cover mix-blend-multiply dark:mix-blend-normal"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{ backgroundImage: getPlaceholderGradient(product.id) }}
                />
              )}
            </div>
            <p className="mt-3 text-[12px] text-[#6E6E73] dark:text-[#A1A1A6]">{product.brand}</p>
            <p className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug tracking-[-0.01em]">
              {product.name}
            </p>
            <p className="mt-2 text-[14px] tabular-nums">{formatWon(product.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TrustCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md bg-white px-5 py-5 dark:bg-[#1C1C1E]">
      <Icon className="size-5 text-[#0071E3]" strokeWidth={1.7} />
      <p className="mt-3 text-[15px] font-semibold tracking-[-0.01em]">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#6E6E73] dark:text-[#A1A1A6]">
        {description}
      </p>
    </div>
  );
}

function FilterPanel({
  query,
  entries,
  onChange,
  onClose,
}: {
  query: WishlistQueryState;
  entries: WishlistEntry[];
  onChange: (query: WishlistQueryState) => void;
  onClose: () => void;
}) {
  const brands = Array.from(new Set(entries.map((entry) => entry.product.brand)));
  const previewCount = filterWishlistEntries(entries, query).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6 px-5 py-5 text-sm">
        <FilterBlock title="상품 상태">
          <Chip
            selected={query.status === "available"}
            onClick={() => onChange({ ...query, status: query.status === "available" ? "" : "available" })}
          >
            구매 가능
          </Chip>
          <Chip
            selected={query.status === "soldout"}
            onClick={() => onChange({ ...query, status: query.status === "soldout" ? "" : "soldout" })}
          >
            품절
          </Chip>
          <Chip
            selected={query.status === "sold"}
            onClick={() => onChange({ ...query, status: query.status === "sold" ? "" : "sold" })}
          >
            판매 완료
          </Chip>
        </FilterBlock>
        <FilterBlock title="상품 구분">
          <Chip
            selected={query.kind === "new"}
            onClick={() => onChange({ ...query, kind: query.kind === "new" ? "" : "new" })}
          >
            새상품
          </Chip>
          <Chip
            selected={query.kind === "preowned"}
            onClick={() => onChange({ ...query, kind: query.kind === "preowned" ? "" : "preowned" })}
          >
            중고명품
          </Chip>
        </FilterBlock>
        <FilterBlock title="중고 등급">
          {(["S", "A", "B"] as const).map((grade) => (
            <Chip
              key={grade}
              selected={query.grade === grade}
              onClick={() => onChange({ ...query, grade: query.grade === grade ? "" : grade })}
            >
              {grade}
            </Chip>
          ))}
        </FilterBlock>
        <FilterBlock title="카테고리">
          {(["bag", "watch", "shoes", "accessory"] as WishlistTab[]).map((tab) => (
            <Chip
              key={tab}
              selected={query.category === tab}
              onClick={() => onChange({ ...query, category: query.category === tab ? "" : tab })}
            >
              {WISHLIST_TAB_LABELS[tab]}
            </Chip>
          ))}
        </FilterBlock>
        <FilterBlock title="브랜드">
          {brands.map((brand) => (
            <Chip
              key={brand}
              selected={query.brand === brand}
              onClick={() => onChange({ ...query, brand: query.brand === brand ? "" : brand })}
            >
              {brand}
            </Chip>
          ))}
        </FilterBlock>
        <FilterBlock title="가격대">
          <Chip
            selected={query.price === "under-200"}
            onClick={() => onChange({ ...query, price: query.price === "under-200" ? "" : "under-200" })}
          >
            200만원 이하
          </Chip>
          <Chip
            selected={query.price === "200-500"}
            onClick={() => onChange({ ...query, price: query.price === "200-500" ? "" : "200-500" })}
          >
            200-500만원
          </Chip>
          <Chip
            selected={query.price === "over-500"}
            onClick={() => onChange({ ...query, price: query.price === "over-500" ? "" : "over-500" })}
          >
            500만원 이상
          </Chip>
        </FilterBlock>
        <FilterBlock title="배송">
          {(["오늘출고", "국내배송", "해외배송", "예약배송"] as const).map((delivery) => (
            <Chip
              key={delivery}
              selected={query.delivery === delivery}
              onClick={() => onChange({ ...query, delivery: query.delivery === delivery ? "" : delivery })}
            >
              {delivery}
            </Chip>
          ))}
        </FilterBlock>
        <FilterBlock title="가격 변동">
          <Chip
            selected={query.priceDrop}
            onClick={() => onChange({ ...query, priceDrop: !query.priceDrop })}
          >
            가격 인하 상품만 보기
          </Chip>
        </FilterBlock>
      </div>
      <div className="flex gap-2 border-t border-[#D2D2D7]/70 px-5 py-4 dark:border-[#424245]">
        <button
          type="button"
          onClick={() => onChange({ ...EMPTY_WISHLIST_QUERY, tab: query.tab, sort: query.sort })}
          className="h-12 flex-1 rounded-md bg-[#F5F5F7] text-[15px] font-medium dark:bg-[#2C2C2E]"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-12 flex-1 rounded-md bg-[#0071E3] text-[15px] text-white hover:bg-[#0077ED]"
        >
          {previewCount}개 보기
        </button>
      </div>
    </div>
  );
}

function AlertPanel({
  selectedIds,
  getRecord,
  onSave,
  onClose,
}: {
  selectedIds: string[];
  getRecord: (productId: string) => WishlistRecord | undefined;
  onSave: (productId: string, alerts: WishlistAlertPrefs) => Promise<void>;
  onClose: () => void;
}) {
  const first = selectedIds[0] ? getRecord(selectedIds[0]) : undefined;
  const [prefs, setPrefs] = useState<WishlistAlertPrefs>(
    first?.alerts ?? {
      priceChange: true,
      restock: false,
      todayShip: false,
      targetPrice: null,
    }
  );
  const [target, setTarget] = useState(first?.alerts.targetPrice ? String(first.alerts.targetPrice) : "");

  if (selectedIds.length === 0) {
    return (
      <p className="px-5 py-8 text-[14px] text-[#6E6E73] dark:text-[#A1A1A6]">
        알림을 설정할 상품을 선택해 주세요.
      </p>
    );
  }

  return (
    <div className="px-5 py-5">
      <p className="text-[14px] leading-relaxed text-[#6E6E73] dark:text-[#A1A1A6]">
        {selectedIds.length}개 상품의 알림 조건을 이 기기에 저장합니다.
        {PRICE_ALERT_PUSH_CONNECTED ? "" : " 푸시 알림 서버는 아직 연결되지 않았어요."}
      </p>
      <div className="mt-5 space-y-2">
        <ToggleRow
          label="가격 변동 알림"
          checked={prefs.priceChange}
          onChange={() => setPrefs((current) => ({ ...current, priceChange: !current.priceChange }))}
        />
        <ToggleRow
          label="재입고 알림"
          checked={prefs.restock}
          onChange={() => setPrefs((current) => ({ ...current, restock: !current.restock }))}
        />
        <ToggleRow
          label="오늘출고 전환 알림"
          checked={prefs.todayShip}
          onChange={() => setPrefs((current) => ({ ...current, todayShip: !current.todayShip }))}
        />
        <label className="grid gap-2 px-1 pt-3 text-[14px]">
          희망 가격
          <input
            inputMode="numeric"
            value={target}
            onChange={(event) => setTarget(event.target.value.replace(/[^\d]/g, ""))}
            className="h-12 rounded-2xl bg-[#F5F5F7] px-4 text-[15px] outline-none dark:bg-[#2C2C2E]"
            placeholder="예: 3200000"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={async () => {
          const alerts = {
            ...prefs,
            targetPrice: target ? Number(target) : null,
          };
          await Promise.all(selectedIds.map((id) => onSave(id, alerts)));
          onClose();
        }}
        className="mt-6 h-12 w-full rounded-md bg-[#0071E3] text-[17px] text-white hover:bg-[#0077ED]"
      >
        조건 저장
      </button>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#F5F5F7] px-4 py-3 dark:bg-[#2C2C2E]">
      <span className="text-[15px]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "relative h-8 w-14 rounded-full transition-colors",
          checked ? "bg-[#0071E3]" : "bg-[#D2D2D7] dark:bg-[#636366]"
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-6 rounded-full bg-white shadow-sm transition-[left]",
            checked ? "left-7" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

function FilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[15px] font-semibold tracking-[-0.01em]">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "min-h-10 rounded-md px-4 text-[14px] transition-colors",
        selected
          ? "bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F]"
          : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] dark:bg-[#2C2C2E] dark:hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
