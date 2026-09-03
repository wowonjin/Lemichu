"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import {
  fetchAdminHomeSections,
  saveAdminHomeSlot,
  type AdminHomeSection,
  type AdminHomeSlot,
} from "@/lib/admin-home-sections";
import { cn } from "@/lib/cn";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import type { MerchProductCard } from "@/lib/home-merchandising";
import type { HomeSlotMode } from "@/lib/home-sections";

type SlotDraft = {
  mode: HomeSlotMode;
  productIds: string[];
};

function cardsById(items: MerchProductCard[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function draftKey(sectionId: string, slotKey: string) {
  return `${sectionId}:${slotKey}`;
}

export function AdminHomeSectionsPage() {
  const [sections, setSections] = useState<AdminHomeSection[]>([]);
  const [catalog, setCatalog] = useState<MerchProductCard[]>([]);
  const [drafts, setDrafts] = useState<Record<string, SlotDraft>>({});
  const [sectionId, setSectionId] = useState<string>("ranking");
  const [slotKey, setSlotKey] = useState("all");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load(options?: { keepSelection?: boolean; silent?: boolean }) {
    if (!options?.silent) setIsLoading(true);
    setError("");
    try {
      const payload = await fetchAdminHomeSections();
      setSections(payload.sections);
      setCatalog(payload.catalog);
      const nextDrafts: Record<string, SlotDraft> = {};
      for (const section of payload.sections) {
        for (const slot of section.slots) {
          nextDrafts[draftKey(section.id, slot.key)] = {
            mode: slot.mode,
            productIds: slot.resolvedItems.map((item) => item.id),
          };
        }
      }
      setDrafts(nextDrafts);
      if (!options?.keepSelection) {
        const first = payload.sections.find((item) => item.id === "ranking") ?? payload.sections[0];
        if (first) {
          setSectionId(first.id);
          setSlotKey(first.slots[0]?.key ?? "");
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "홈 섹션을 불러오지 못했어요.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const catalogMap = useMemo(() => cardsById(catalog), [catalog]);
  const section = sections.find((item) => item.id === sectionId) ?? sections[0];
  const slot = section?.slots.find((item) => item.key === slotKey) ?? section?.slots[0];
  const draft = section && slot ? drafts[draftKey(section.id, slot.key)] : undefined;
  const autoMap = useMemo(() => cardsById(slot?.autoItems ?? []), [slot]);

  const selectedItems = useMemo(() => {
    if (!draft) return slot?.resolvedItems ?? [];
    return draft.productIds
      .map((id) => catalogMap.get(id) ?? autoMap.get(id))
      .filter((item): item is MerchProductCard => Boolean(item));
  }, [autoMap, catalogMap, draft, slot]);

  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const selected = new Set(draft?.productIds ?? []);
    return catalog
      .filter((item) => {
        if (selected.has(item.id)) return false;
        if (!needle) return true;
        return `${item.brand} ${item.name}`.toLowerCase().includes(needle);
      })
      .slice(0, 8);
  }, [catalog, draft?.productIds, query]);

  function updateDraft(patch: Partial<SlotDraft>) {
    if (!section || !slot) return;
    const key = draftKey(section.id, slot.key);
    setDrafts((current) => ({
      ...current,
      [key]: { mode: current[key]?.mode ?? "auto", productIds: current[key]?.productIds ?? [], ...patch },
    }));
    setMessage("");
  }

  function moveItem(index: number, direction: -1 | 1) {
    if (!draft) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.productIds.length) return;
    const next = [...draft.productIds];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(nextIndex, 0, item);
    updateDraft({ mode: "manual", productIds: next });
  }

  async function handleSave() {
    if (!section || !slot || !draft) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await saveAdminHomeSlot({
        sectionId: section.id,
        slotKey: slot.key,
        mode: draft.mode,
        productIds: draft.productIds,
      });
      setMessage(`‘${section.title} · ${slot.label}’ 구성을 저장했습니다. 메인에 바로 반영됩니다.`);
      await load({ keepSelection: true, silent: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="홈 섹션 알고리즘"
        actions={
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || isLoading || !draft}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            이 슬롯 저장
          </button>
        }
      />

      {error ? <AdminNotice message={error} /> : null}
      {message ? (
        <div className="mb-6 border-l-2 border-gold bg-gold-soft/50 px-4 py-3 text-sm font-medium text-foreground">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <EmptyAdminState text="홈 섹션 점수와 상품 리스트를 계산하는 중입니다." />
      ) : !section || !slot || !draft ? (
        <EmptyAdminState text="표시할 홈 섹션이 없습니다." />
      ) : (
        <div className="grid gap-8 xl:grid-cols-[240px_1fr]">
          <aside className="space-y-1">
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSectionId(item.id);
                  setSlotKey(item.slots[0]?.key ?? "");
                  setQuery("");
                }}
                className={cn(
                  "w-full rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  item.id === section.id
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                {item.homeTitle}
              </button>
            ))}
          </aside>

          <div className="min-w-0 space-y-8">
            <AlgorithmCard section={section} />

            {section.slots.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {section.slots.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSlotKey(item.key);
                      setQuery("");
                    }}
                    className={cn(
                      "rounded-md px-3.5 py-2 text-sm font-semibold transition-colors",
                      item.key === slot.key
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            <SlotToolbar
              slot={slot}
              draft={draft}
              onModeChange={(mode) => {
                if (mode === "auto") {
                  updateDraft({
                    mode,
                    productIds: slot.autoItems.map((item) => item.id),
                  });
                  return;
                }
                updateDraft({ mode });
              }}
              onResetAuto={() =>
                updateDraft({
                  mode: draft.mode,
                  productIds: slot.autoItems.map((item) => item.id),
                })
              }
            />

            <section>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {slot.label} 노출 상품
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    메인에는 상위 {slot.visibleOnHome}개가 보이고, 여기서는 {slot.limit}개까지 순서를
                    정할 수 있습니다.
                  </p>
                </div>
                <p className="text-sm font-medium tabular-nums text-muted-foreground">
                  {selectedItems.length}/{slot.limit}
                </p>
              </div>

              {selectedItems.length === 0 ? (
                <EmptyAdminState text="이 슬롯에 들어갈 상품이 없습니다. 아래에서 추가하거나 알고리즘으로 채우세요." />
              ) : (
                <div className="divide-y divide-border border-y border-border">
                  {selectedItems.map((item, index) => (
                    <ProductRow
                      key={item.id}
                      item={item}
                      rank={index + 1}
                      visibleOnHome={index < slot.visibleOnHome}
                      readOnly={draft.mode === "auto"}
                      onMoveUp={() => moveItem(index, -1)}
                      onMoveDown={() => moveItem(index, 1)}
                      onRemove={() =>
                        updateDraft({
                          mode: "manual",
                          productIds: draft.productIds.filter((id) => id !== item.id),
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            {draft.mode === "manual" ? (
              <section>
                <h3 className="text-base font-semibold text-foreground">상품 추가</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  브랜드나 상품명으로 검색한 뒤 리스트에 넣으면 메인 순서가 바뀝니다.
                </p>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="브랜드, 상품명 검색"
                  className="mt-4 h-10 w-full max-w-md rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-gold"
                />
                <div className="mt-3 divide-y divide-border border-y border-border">
                  {searchResults.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-3">
                      <ProductThumb item={item} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.brand}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.name}</p>
                      </div>
                      <button
                        type="button"
                        disabled={draft.productIds.length >= slot.limit}
                        onClick={() =>
                          updateDraft({
                            mode: "manual",
                            productIds: [...draft.productIds, item.id].slice(0, slot.limit),
                          })
                        }
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold disabled:opacity-50"
                      >
                        <Plus className="size-3.5" />
                        추가
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

function AlgorithmCard({ section }: { section: AdminHomeSection }) {
  return (
    <section className="rounded-xl border border-border bg-secondary/40 p-5 md:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {section.algorithm.name}
      </p>
      <p className="mt-3 text-sm leading-6 text-foreground">{section.algorithm.summary}</p>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        참고: {section.algorithm.inspiredBy.join(" · ")}
      </p>
      <pre className="mt-5 overflow-x-auto rounded-lg bg-background px-4 py-4 text-[12px] leading-6 text-foreground">
        {section.algorithm.formula}
      </pre>
      <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
        {section.algorithm.variables.map((variable) => (
          <div key={variable.symbol} className="min-w-0">
            <dt className="font-semibold text-foreground">{variable.symbol}</dt>
            <dd className="mt-0.5 text-muted-foreground">{variable.meaning}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SlotToolbar({
  slot,
  draft,
  onModeChange,
  onResetAuto,
}: {
  slot: AdminHomeSlot;
  draft: SlotDraft;
  onModeChange: (mode: HomeSlotMode) => void;
  onResetAuto: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{slot.hint}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {draft.mode === "auto"
            ? "자동 모드입니다. 조회·찜·판매 시그널이 바뀌면 리스트가 다시 계산됩니다."
            : "수동 모드입니다. 순서와 구성이 저장한 그대로 메인에 나갑니다."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["auto", "manual"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onModeChange(mode)}
            className={cn(
              "rounded-md px-3 py-2 text-xs font-semibold",
              draft.mode === mode
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {mode === "auto" ? "자동 산출" : "수동 편집"}
          </button>
        ))}
        <button
          type="button"
          onClick={onResetAuto}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground"
        >
          <RotateCcw className="size-3.5" />
          알고리즘으로 채우기
        </button>
      </div>
    </div>
  );
}

function ProductRow({
  item,
  rank,
  visibleOnHome,
  readOnly,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  item: MerchProductCard;
  rank: number;
  visibleOnHome: boolean;
  readOnly: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const { breakdown } = item;

  return (
    <div className="flex items-start gap-3 py-3.5">
      <span className="w-7 shrink-0 pt-2 text-sm font-bold tabular-nums text-muted-foreground">
        {String(rank).padStart(2, "0")}
      </span>
      <ProductThumb item={item} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {item.brand} {item.name}
          </p>
          {visibleOnHome ? (
            <span className="rounded-md bg-gold-soft px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
              메인 노출
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm tabular-nums text-foreground">{formatPriceWithUnit(item.price)}</p>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
          S={item.score.toFixed(3)} · λ={breakdown.lambda.toFixed(2)} · C={breakdown.content.toFixed(2)} ·
          B={breakdown.behavior.toFixed(2)} · 조회 {breakdown.views} · 찜 {breakdown.wishes} · 판매{" "}
          {breakdown.sales}
        </p>
      </div>
      {readOnly ? null : (
        <div className="flex shrink-0 gap-1">
          <IconButton label="위로" onClick={onMoveUp}>
            <ArrowUp className="size-3.5" />
          </IconButton>
          <IconButton label="아래로" onClick={onMoveDown}>
            <ArrowDown className="size-3.5" />
          </IconButton>
          <IconButton label="제거" onClick={onRemove}>
            <Trash2 className="size-3.5" />
          </IconButton>
        </div>
      )}
    </div>
  );
}

function ProductThumb({ item }: { item: MerchProductCard }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.imageUrl}
      alt=""
      className="size-14 shrink-0 rounded-md bg-muted object-cover"
    />
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"
    >
      {children}
    </button>
  );
}
