"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  PlusCircle,
  Save,
  Trash2,
} from "lucide-react";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { cn } from "@/lib/cn";
import { uploadProductImage } from "@/lib/product-images";
import {
  createHeroSlide,
  deleteHeroSlide,
  fetchHeroSlides,
  reorderHeroSlides,
  seedHeroSlides,
  updateHeroSlide,
  type StoreHeroSlide,
} from "@/lib/hero-slides";

type DraftSlide = StoreHeroSlide & {
  imageFile?: File | null;
};

function toDraft(slide: StoreHeroSlide): DraftSlide {
  return { ...slide, imageFile: null };
}

export function AdminHeroSlidesPage() {
  const [slides, setSlides] = useState<DraftSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setIsLoading(true);
    setError("");
    try {
      const next = await fetchHeroSlides();
      setSlides(next.map(toDraft));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "슬라이드를 불러오지 못했어요.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function updateDraft(id: string, patch: Partial<DraftSlide>) {
    setSlides((current) => current.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)));
  }

  async function handleSeed() {
    setSavingId("seed");
    setError("");
    setMessage("");
    try {
      const seeded = await seedHeroSlides();
      setSlides(seeded.map(toDraft));
      setMessage("기본 슬라이드 6개를 데이터베이스에 넣었습니다. 이제 문구와 이미지를 수정할 수 있습니다.");
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : "기본 슬라이드를 넣지 못했어요.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleSave(slide: DraftSlide) {
    if (!slide.title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (!slide.ctaHref.trim()) {
      setError("버튼 링크를 입력해주세요.");
      return;
    }

    setSavingId(slide.id);
    setError("");
    setMessage("");

    try {
      let image = slide.image;
      if (slide.imageFile) {
        const uploaded = await uploadProductImage({
          file: slide.imageFile,
          directory: `hero-slides/${slide.id}`,
          alt: slide.title,
          index: 0,
        });
        image = uploaded.original.url;
      }

      await updateHeroSlide(slide.id, {
        eyebrow: slide.eyebrow.trim(),
        title: slide.title.trim(),
        subtitle: slide.subtitle.trim(),
        ctaLabel: slide.ctaLabel.trim() || "자세히 보기",
        ctaHref: slide.ctaHref.trim(),
        image,
        dark: slide.dark,
        visible: slide.visible,
        order: slide.order,
      });

      updateDraft(slide.id, { image, imageFile: null });
      setMessage(`‘${slide.title.trim()}’ 슬라이드를 저장했습니다.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "슬라이드를 저장하지 못했어요.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleAdd() {
    setSavingId("add");
    setError("");
    setMessage("");
    try {
      const order = slides.length;
      const id = await createHeroSlide({
        eyebrow: "New Slide",
        title: "새 슬라이드 제목",
        subtitle: "메인에서 보여줄 설명을 입력하세요.",
        ctaLabel: "자세히 보기",
        ctaHref: "/products",
        image: "/hero/hero-new.jpg",
        dark: false,
        visible: true,
        order,
      });
      setSlides((current) => [
        ...current,
        {
          id,
          eyebrow: "New Slide",
          title: "새 슬라이드 제목",
          subtitle: "메인에서 보여줄 설명을 입력하세요.",
          ctaLabel: "자세히 보기",
          ctaHref: "/products",
          image: "/hero/hero-new.jpg",
          dark: false,
          visible: true,
          order,
          imageFile: null,
        },
      ]);
      setMessage("빈 슬라이드를 추가했습니다. 내용을 수정한 뒤 저장하세요.");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "슬라이드를 추가하지 못했어요.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(slide: DraftSlide) {
    if (!window.confirm(`‘${slide.title || "이 슬라이드"}’를 삭제할까요?`)) return;
    setSavingId(slide.id);
    setError("");
    try {
      await deleteHeroSlide(slide.id);
      const remaining = slides.filter((item) => item.id !== slide.id);
      setSlides(remaining);
      await reorderHeroSlides(remaining.map((item) => item.id));
      setMessage("슬라이드를 삭제했습니다.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "슬라이드를 삭제하지 못했어요.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= slides.length) return;
    const next = [...slides];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    const ordered = next.map((slide, order) => ({ ...slide, order }));
    setSlides(ordered);
    setSavingId("reorder");
    try {
      await reorderHeroSlides(ordered.map((slide) => slide.id));
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "순서를 바꾸지 못했어요.");
      void load();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="메인 슬라이드"
        actions={
          <div className="flex flex-wrap gap-2">
            {slides.length === 0 ? (
              <button
                type="button"
                disabled={Boolean(savingId)}
                onClick={() => void handleSeed()}
                className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-60"
              >
                {savingId === "seed" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                기본 슬라이드 넣기
              </button>
            ) : null}
            <button
              type="button"
              disabled={Boolean(savingId)}
              onClick={() => void handleAdd()}
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
            >
              {savingId === "add" ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
              슬라이드 추가
            </button>
          </div>
        }
      />

      <p className="mb-6 max-w-2xl text-sm leading-6 text-muted-foreground">
        홈 상단 회전 배너의 문구, 버튼, 이미지를 여기서 수정합니다. 저장하면 메인에 바로 반영됩니다.
      </p>

      {error ? <AdminNotice message={error} /> : null}
      {message ? (
        <div className="mb-6 border-l-2 border-gold bg-gold-soft/50 px-4 py-3 text-sm font-medium text-foreground">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <EmptyAdminState text="슬라이드를 불러오는 중입니다." />
      ) : slides.length === 0 ? (
        <EmptyAdminState text="등록된 슬라이드가 없습니다. 기본 슬라이드를 넣거나 새로 추가하세요." />
      ) : (
        <div className="space-y-5">
          {slides.map((slide, index) => (
            <SlideEditor
              key={slide.id}
              slide={slide}
              index={index}
              total={slides.length}
              disabled={Boolean(savingId)}
              saving={savingId === slide.id}
              onChange={(patch) => updateDraft(slide.id, patch)}
              onSave={() => void handleSave(slide)}
              onDelete={() => void handleDelete(slide)}
              onMove={(direction) => void handleMove(index, direction)}
            />
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function SlideEditor({
  slide,
  index,
  total,
  disabled,
  saving,
  onChange,
  onSave,
  onDelete,
  onMove,
}: {
  slide: DraftSlide;
  index: number;
  total: number;
  disabled: boolean;
  saving: boolean;
  onChange: (patch: Partial<DraftSlide>) => void;
  onSave: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [preview, setPreview] = useState(slide.image);

  useEffect(() => {
    if (!slide.imageFile) {
      setPreview(slide.image);
      return;
    }
    const url = URL.createObjectURL(slide.imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [slide.image, slide.imageFile]);

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{index + 1}번째 슬라이드</p>
          <p className="text-xs text-muted-foreground">{slide.visible ? "메인 노출" : "숨김"}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={disabled || index === 0}
            onClick={() => onMove(-1)}
            aria-label="위로"
            className="grid size-9 place-items-center rounded-md border border-border disabled:opacity-40"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            disabled={disabled || index === total - 1}
            onClick={() => onMove(1)}
            aria-label="아래로"
            className="grid size-9 place-items-center rounded-md border border-border disabled:opacity-40"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <div className="overflow-hidden rounded-lg border border-border bg-secondary">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="aspect-[16/9] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/9] place-items-center text-xs text-muted-foreground">
                이미지 없음
              </div>
            )}
          </div>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">이미지 파일</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={disabled}
              onChange={(event) => onChange({ imageFile: event.target.files?.[0] ?? null })}
              className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="작은 제목">
            <Input
              value={slide.eyebrow}
              onChange={(value) => onChange({ eyebrow: value })}
              placeholder="This Week’s Arrival"
            />
          </Field>
          <Field label="제목" required>
            <Input
              value={slide.title}
              onChange={(value) => onChange({ title: value })}
              placeholder="이번 주 검수 완료"
            />
          </Field>
          <Field label="설명" className="sm:col-span-2">
            <textarea
              value={slide.subtitle}
              onChange={(event) => onChange({ subtitle: event.target.value })}
              rows={3}
              placeholder="메인에서 보여줄 설명을 입력하세요."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </Field>
          <Field label="버튼 문구">
            <Input
              value={slide.ctaLabel}
              onChange={(value) => onChange({ ctaLabel: value })}
              placeholder="신상품 보기"
            />
          </Field>
          <Field label="버튼 링크" required>
            <Input
              value={slide.ctaHref}
              onChange={(value) => onChange({ ctaHref: value })}
              placeholder="/products"
            />
          </Field>
          <Field label="이미지 경로" className="sm:col-span-2">
            <Input
              value={slide.image}
              onChange={(value) => onChange({ image: value, imageFile: null })}
              placeholder="/hero/hero-new.jpg"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={slide.dark}
              onChange={(event) => onChange({ dark: event.target.checked })}
            />
            어두운 배경용 흰 글씨
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={slide.visible}
              onChange={(event) => onChange({ visible: event.target.checked })}
            />
            메인에 노출
          </label>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-4 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
        >
          <Trash2 className="size-4" />
          삭제
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onSave}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          저장
        </button>
      </div>
    </article>
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
