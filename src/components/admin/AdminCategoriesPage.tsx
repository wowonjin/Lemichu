"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ImagePlus,
  Loader2,
  PlusCircle,
  Save,
  Trash2,
} from "lucide-react";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { cn } from "@/lib/cn";
import {
  defaultHomeCategories,
  type HomeCategoryContent,
  type HomeCategoryContentItem,
  type HomeCategoryId,
} from "@/data/homeCategories";
import {
  fetchHomeCategories,
  saveHomeCategory,
  seedHomeCategories,
} from "@/lib/home-categories";
import { uploadProductImage } from "@/lib/product-images";

type DraftCategory = HomeCategoryContent & {
  imageFile?: File | null;
};

type ItemDraft = {
  brand: string;
  title: string;
  description: string;
  priceLabel: string;
  href: string;
  imageFile: File | null;
};

const emptyItem: ItemDraft = {
  brand: "",
  title: "",
  description: "",
  priceLabel: "",
  href: "",
  imageFile: null,
};

function createItemId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}`;
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<DraftCategory[]>([]);
  const [activeId, setActiveId] = useState<HomeCategoryId>("women-bags");
  const [itemDraft, setItemDraft] = useState<ItemDraft>(emptyItem);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setIsLoading(true);
    setError("");
    try {
      const next = await fetchHomeCategories();
      setCategories(next.map((category) => ({ ...category, imageFile: null })));
    } catch (loadError) {
      setCategories(defaultHomeCategories.map((category) => ({ ...category, imageFile: null })));
      setError(
        loadError instanceof Error
          ? loadError.message
          : "카테고리를 불러오지 못했어요. 기본값을 보여줍니다."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const active = categories.find((category) => category.id === activeId) ?? categories[0];

  function updateCategory(id: HomeCategoryId, patch: Partial<DraftCategory>) {
    setCategories((current) =>
      current.map((category) => (category.id === id ? { ...category, ...patch } : category))
    );
  }

  async function handleSeed() {
    setSavingKey("seed");
    setError("");
    setMessage("");
    try {
      const seeded = await seedHomeCategories();
      setCategories(seeded.map((category) => ({ ...category, imageFile: null })));
      setMessage("8개 카테고리 기본 이미지와 내용을 저장했습니다. 이제 수정·추가·삭제할 수 있습니다.");
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : "기본 카테고리를 넣지 못했어요.");
    } finally {
      setSavingKey("");
    }
  }

  async function persist(category: DraftCategory, nextItems?: HomeCategoryContentItem[]) {
    let imageSrc = category.imageSrc;
    if (category.imageFile) {
      const uploaded = await uploadProductImage({
        file: category.imageFile,
        directory: `home-categories/${category.id}`,
        alt: category.label,
        index: 0,
      });
      imageSrc = uploaded.original.url;
    }

    const payload: HomeCategoryContent = {
      id: category.id,
      label: category.label.trim() || category.id,
      href: category.href.trim() || "/",
      hint: category.hint.trim(),
      description: category.description.trim(),
      imageSrc,
      visible: category.visible,
      order: category.order,
      items: nextItems ?? category.items,
    };

    await saveHomeCategory(payload);
    updateCategory(category.id, { ...payload, imageFile: null });
    return payload;
  }

  async function handleSave() {
    if (!active) return;
    if (!active.label.trim()) {
      setError("카테고리 이름을 입력해주세요.");
      return;
    }

    setSavingKey(`save-${active.id}`);
    setError("");
    setMessage("");
    try {
      await persist(active);
      setMessage(`‘${active.label.trim()}’ 카테고리를 저장했습니다. 홈과 카테고리 페이지에 반영됩니다.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "카테고리를 저장하지 못했어요.");
    } finally {
      setSavingKey("");
    }
  }

  async function handleAddItem() {
    if (!active) return;
    if (!itemDraft.title.trim()) {
      setError("콘텐츠 제목을 입력해주세요.");
      return;
    }
    if (!itemDraft.imageFile) {
      setError("콘텐츠 이미지를 선택해주세요.");
      return;
    }

    setSavingKey(`add-${active.id}`);
    setError("");
    setMessage("");
    try {
      const uploaded = await uploadProductImage({
        file: itemDraft.imageFile,
        directory: `home-categories/${active.id}/items`,
        alt: itemDraft.title.trim(),
        index: active.items.length,
      });
      const nextItem: HomeCategoryContentItem = {
        id: createItemId(),
        brand: itemDraft.brand.trim(),
        title: itemDraft.title.trim(),
        description: itemDraft.description.trim(),
        imageSrc: uploaded.original.url,
        priceLabel: itemDraft.priceLabel.trim() || undefined,
        href: itemDraft.href.trim() || undefined,
      };
      await persist(active, [...active.items, nextItem]);
      setItemDraft(emptyItem);
      setMessage(`‘${nextItem.title}’ 콘텐츠를 추가했습니다.`);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "콘텐츠를 추가하지 못했어요.");
    } finally {
      setSavingKey("");
    }
  }

  async function handleDeleteItem(item: HomeCategoryContentItem) {
    if (!active) return;
    if (!window.confirm(`‘${item.title}’ 콘텐츠를 삭제할까요?`)) return;

    setSavingKey(`delete-${item.id}`);
    setError("");
    setMessage("");
    try {
      await persist(
        active,
        active.items.filter((entry) => entry.id !== item.id)
      );
      setMessage("콘텐츠를 삭제했습니다.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "콘텐츠를 삭제하지 못했어요.");
    } finally {
      setSavingKey("");
    }
  }

  const busy = Boolean(savingKey);

  return (
    <AdminShell>
      <AdminPageHeader
        title="카테고리 관리"
        actions={
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSeed()}
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-60"
          >
            {savingKey === "seed" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            기본 이미지·내용 넣기
          </button>
        }
      />

      <p className="mb-6 max-w-2xl text-sm leading-6 text-muted-foreground">
        홈의 여성가방·남성가방·지갑·시계·주얼리·슈즈·중고명품·오늘출고에 들어가는 대표 이미지와
        콘텐츠를 여기서 추가·삭제합니다. 저장하면 각 카테고리 페이지에도 같이 반영됩니다.
      </p>

      {error ? <AdminNotice message={error} /> : null}
      {message ? (
        <div className="mb-6 border-l-2 border-gold bg-gold-soft/50 px-4 py-3 text-sm font-medium text-foreground">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <EmptyAdminState text="카테고리를 불러오는 중입니다." />
      ) : !active ? (
        <EmptyAdminState text="등록된 카테고리가 없습니다." />
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((category) => {
              const selected = category.id === active.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveId(category.id);
                    setItemDraft(emptyItem);
                    setError("");
                  }}
                  className={cn(
                    "shrink-0 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors",
                    selected
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground hover:bg-secondary/70"
                  )}
                >
                  {category.label}
                </button>
              );
            })}
          </div>

          <article className="mt-5 overflow-hidden rounded-xl border border-border bg-background">
            <div className="grid gap-6 p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <CategoryImageField
                imageSrc={active.imageSrc}
                imageFile={active.imageFile ?? null}
                disabled={busy}
                onFileChange={(file) => updateCategory(active.id, { imageFile: file })}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="카테고리 이름" required>
                  <Input
                    value={active.label}
                    onChange={(value) => updateCategory(active.id, { label: value })}
                    placeholder="여성가방"
                  />
                </Field>
                <Field label="영문/힌트">
                  <Input
                    value={active.hint}
                    onChange={(value) => updateCategory(active.id, { hint: value })}
                    placeholder="Women's Bags"
                  />
                </Field>
                <Field label="링크" required className="sm:col-span-2">
                  <Input
                    value={active.href}
                    onChange={(value) => updateCategory(active.id, { href: value })}
                    placeholder="/category/women-bags"
                  />
                </Field>
                <Field label="설명" className="sm:col-span-2">
                  <textarea
                    value={active.description}
                    onChange={(event) => updateCategory(active.id, { description: event.target.value })}
                    rows={3}
                    placeholder="카테고리 페이지 상단에 노출되는 설명입니다."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
                  />
                </Field>
                <Field label="대표 이미지 경로" className="sm:col-span-2">
                  <Input
                    value={active.imageSrc}
                    onChange={(value) => updateCategory(active.id, { imageSrc: value, imageFile: null })}
                    placeholder="/category-images/cat-women-bags-cut.png"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={active.visible}
                    onChange={(event) => updateCategory(active.id, { visible: event.target.checked })}
                  />
                  홈 빠른 카테고리에 노출
                </label>
              </div>
            </div>

            <div className="flex justify-end border-t border-border px-5 py-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSave()}
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
              >
                {savingKey === `save-${active.id}` ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                카테고리 저장
              </button>
            </div>
          </article>

          <section className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">등록된 콘텐츠</h3>
              <span className="text-xs font-semibold text-muted-foreground">{active.items.length}개</span>
            </div>

            {active.items.length === 0 ? (
              <EmptyAdminState text="아직 등록된 콘텐츠가 없습니다. 아래에서 이미지와 내용을 추가하세요." />
            ) : (
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {active.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-border bg-background p-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageSrc}
                      alt=""
                      className="size-20 shrink-0 rounded-lg bg-[#f4f6f8] object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.brand ? `${item.brand} ` : ""}
                        {item.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {item.description || item.href || "설명 없음"}
                      </p>
                      {item.priceLabel ? (
                        <p className="mt-1 text-xs font-semibold text-foreground">{item.priceLabel}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDeleteItem(item)}
                      className="inline-flex h-9 shrink-0 items-center gap-1 self-start rounded-md border border-border px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                    >
                      {savingKey === `delete-${item.id}` ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8 rounded-xl border border-border bg-background p-5">
            <h3 className="text-base font-semibold text-foreground">콘텐츠 추가</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              이미지와 문구를 넣으면 해당 카테고리 페이지 상단 큐레이션에 바로 추가됩니다.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="브랜드">
                <Input
                  value={itemDraft.brand}
                  onChange={(value) => setItemDraft((current) => ({ ...current, brand: value }))}
                  placeholder="샤넬"
                />
              </Field>
              <Field label="제목" required>
                <Input
                  value={itemDraft.title}
                  onChange={(value) => setItemDraft((current) => ({ ...current, title: value }))}
                  placeholder="클래식 플랩백"
                />
              </Field>
              <Field label="설명" className="sm:col-span-2">
                <textarea
                  value={itemDraft.description}
                  onChange={(event) =>
                    setItemDraft((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={3}
                  placeholder="카테고리에 보여줄 설명을 입력하세요."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
                />
              </Field>
              <Field label="가격 표시">
                <Input
                  value={itemDraft.priceLabel}
                  onChange={(value) => setItemDraft((current) => ({ ...current, priceLabel: value }))}
                  placeholder="₩9,480,000"
                />
              </Field>
              <Field label="링크">
                <Input
                  value={itemDraft.href}
                  onChange={(value) => setItemDraft((current) => ({ ...current, href: value }))}
                  placeholder="/product/buyma-123456789"
                />
              </Field>
              <Field label="이미지" required className="sm:col-span-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={busy}
                  onChange={(event) =>
                    setItemDraft((current) => ({
                      ...current,
                      imageFile: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground"
                />
              </Field>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleAddItem()}
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
              >
                {savingKey === `add-${active.id}` ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PlusCircle className="size-4" />
                )}
                콘텐츠 추가
              </button>
            </div>
          </section>
        </>
      )}
    </AdminShell>
  );
}

function CategoryImageField({
  imageSrc,
  imageFile,
  disabled,
  onFileChange,
}: {
  imageSrc: string;
  imageFile: File | null;
  disabled: boolean;
  onFileChange: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState(imageSrc);

  useEffect(() => {
    if (!imageFile) {
      setPreview(imageSrc);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile, imageSrc]);

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-[#f4f6f8]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="aspect-square w-full object-contain" />
        ) : (
          <div className="grid aspect-square place-items-center text-xs text-muted-foreground">
            이미지 없음
          </div>
        )}
      </div>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">대표 이미지</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={disabled}
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground"
        />
      </label>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-gold placeholder:text-muted-foreground"
    />
  );
}
