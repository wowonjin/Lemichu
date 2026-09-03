"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { saveHeaderBanner } from "@/lib/headerBanner-store";
import {
  createEmptyHeaderBannerSlide,
  getHeaderBannerTheme,
  HEADER_BANNER_THEME_IDS,
  HEADER_BANNER_THEMES,
  nextHeaderBannerTheme,
  normalizeHeaderBanner,
  type HeaderBannerSettings,
  type HeaderBannerSlide,
} from "@/lib/headerBanner";

const fieldClassName =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-gold placeholder:text-muted-foreground";

export function HeaderBannerEditor({
  initial,
  compact = false,
  onSaved,
  onChange,
}: {
  initial: HeaderBannerSettings;
  compact?: boolean;
  onSaved?: (settings: HeaderBannerSettings) => void;
  onChange?: (settings: HeaderBannerSettings) => void;
}) {
  const [settings, setSettings] = useState(() => normalizeHeaderBanner(initial));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const visibleCount = useMemo(
    () => settings.slides.filter((slide) => slide.enabled && slide.text.trim()).length,
    [settings.slides]
  );

  const commit = (next: HeaderBannerSettings) => {
    setSettings(next);
    onChange?.(next);
    setSuccess("");
  };

  const updateSettings = (patch: Partial<HeaderBannerSettings>) => {
    commit({ ...settings, ...patch });
  };

  const updateSlide = (index: number, patch: Partial<HeaderBannerSlide>) => {
    commit({
      ...settings,
      slides: settings.slides.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, ...patch } : slide
      ),
    });
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= settings.slides.length) return;

    const slides = [...settings.slides];
    [slides[index], slides[nextIndex]] = [slides[nextIndex], slides[index]];
    commit({ ...settings, slides });
  };

  const removeSlide = (index: number) => {
    commit({
      ...settings,
      slides: settings.slides.filter((_, slideIndex) => slideIndex !== index),
    });
  };

  const handleSave = async () => {
    const next = normalizeHeaderBanner(settings);
    if (next.enabled && next.slides.every((slide) => !slide.enabled || !slide.text.trim())) {
      setError("표시할 문구를 최소 1개 입력해주세요.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await saveHeaderBanner(next);
      setSettings(result.settings);
      onSaved?.(result.settings);
      setSuccess("저장했습니다. 쇼핑몰 상단 배너에 바로 반영됩니다.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "배너를 저장하지 못했어요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn("space-y-6", compact && "space-y-5")}>
      {error ? (
        <div className="border-l-2 border-rose-400 bg-rose-50/60 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="border-l-2 border-emerald-400 bg-emerald-50/60 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <ToggleField
          label="배너 표시"
          checked={settings.enabled}
          onChange={(enabled) => updateSettings({ enabled })}
          description="끄면 쇼핑몰 헤더 위 이벤트 바가 숨겨집니다."
        />
        <ToggleField
          label="자동 롤링"
          checked={settings.autoRotate}
          onChange={(autoRotate) => updateSettings({ autoRotate })}
          description="여러 문구를 설정한 간격으로 넘깁니다."
        />
        <label className="block sm:col-span-2 sm:max-w-xs">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
            롤링 간격 (초)
          </span>
          <input
            type="number"
            min={2}
            max={15}
            value={Math.round(settings.intervalMs / 1000)}
            onChange={(event) =>
              updateSettings({ intervalMs: Number(event.target.value) * 1000 })
            }
            className={fieldClassName}
          />
        </label>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">롤링 문구</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              노출 중 {visibleCount}개 · 문구마다 다른 토스 컬러 테마를 고를 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateSettings({
                slides: [
                  ...settings.slides,
                  createEmptyHeaderBannerSlide(nextHeaderBannerTheme(settings.slides.map((slide) => slide.theme))),
                ],
              })
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <Plus className="size-3.5" />
            문구 추가
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {settings.slides.map((slide, index) => {
            const theme = getHeaderBannerTheme(slide);

            return (
              <article
                key={slide.id}
                className="rounded-xl border border-border bg-background p-4"
                style={{ boxShadow: `inset 3px 0 0 ${theme.accent}` }}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={slide.enabled}
                      onChange={(event) => updateSlide(index, { enabled: event.target.checked })}
                      className="size-4 accent-foreground"
                    />
                    {index + 1}번 문구
                  </label>
                  <div className="flex items-center gap-1">
                    <IconButton label="위로" onClick={() => moveSlide(index, -1)}>
                      <ArrowUp className="size-3.5" />
                    </IconButton>
                    <IconButton label="아래로" onClick={() => moveSlide(index, 1)}>
                      <ArrowDown className="size-3.5" />
                    </IconButton>
                    <IconButton label="삭제" onClick={() => removeSlide(index)}>
                      <Trash2 className="size-3.5" />
                    </IconButton>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[11px] font-medium text-muted-foreground">테마</span>
                  {HEADER_BANNER_THEME_IDS.map((themeId) => {
                    const option = HEADER_BANNER_THEMES[themeId];
                    const active = slide.theme === themeId;

                    return (
                      <button
                        key={themeId}
                        type="button"
                        title={option.label}
                        aria-label={option.label}
                        aria-pressed={active}
                        onClick={() => updateSlide(index, { theme: themeId })}
                        className={cn(
                          "size-7 rounded-md border-2 transition-transform",
                          active
                            ? "scale-110 border-foreground"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{
                          backgroundColor: option.background,
                          boxShadow: `inset 0 0 0 1px ${option.accent}`,
                        }}
                      />
                    );
                  })}
                  <span className="text-[11px] font-medium" style={{ color: theme.accent }}>
                    {theme.label}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                  <input
                    value={slide.badge}
                    onChange={(event) => updateSlide(index, { badge: event.target.value })}
                    placeholder="쿠폰"
                    className={fieldClassName}
                  />
                  <input
                    value={slide.text}
                    onChange={(event) => updateSlide(index, { text: event.target.value })}
                    placeholder="신규가입 즉시 5,000원 쿠폰 받기"
                    className={fieldClassName}
                  />
                  <input
                    value={slide.href}
                    onChange={(event) => updateSlide(index, { href: event.target.value })}
                    placeholder="/events"
                    className={cn(fieldClassName, "sm:col-span-2")}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isSaving ? "저장 중..." : "배너 저장"}
        </button>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-border px-4 py-3">
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 accent-foreground"
      />
    </label>
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
      className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </button>
  );
}
