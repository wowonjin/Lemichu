"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import { HeaderBannerEditor } from "@/components/admin/HeaderBannerEditor";
import { ADMIN_EMAIL, isAdminUser, observeAuthUser, type AuthUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import {
  dismissHeaderBannerForToday,
  isHeaderBannerDismissedToday,
  observeHeaderBanner,
} from "@/lib/headerBanner-store";
import {
  DEFAULT_HEADER_BANNER,
  getHeaderBannerTheme,
  getVisibleHeaderBannerSlides,
  resolveHeaderBannerHref,
  type HeaderBannerSettings,
} from "@/lib/headerBanner";

const controlClassName =
  "grid size-8 place-items-center rounded-md text-current/35 transition-[color,background-color,transform] duration-150 hover:bg-current/10 hover:text-current active:scale-90";

export function HeaderEventBanner({ previewSettings }: { previewSettings?: HeaderBannerSettings }) {
  const [settings, setSettings] = useState(previewSettings ?? DEFAULT_HEADER_BANNER);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const fadeTimer = useRef<number | null>(null);
  const isPreview = Boolean(previewSettings);

  useEffect(() => {
    if (previewSettings) setSettings(previewSettings);
  }, [previewSettings]);

  useEffect(() => {
    if (isPreview) return;
    setDismissed(isHeaderBannerDismissedToday());
    return observeHeaderBanner(setSettings);
  }, [isPreview]);

  useEffect(() => {
    if (isPreview) return;
    return observeAuthUser(setAuthUser);
  }, [isPreview]);

  useEffect(() => {
    return () => {
      if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
    };
  }, []);

  const slides = useMemo(() => getVisibleHeaderBannerSlides(settings), [settings]);
  const canEdit =
    !isPreview && isAdminUser(authUser) && authUser.email.toLowerCase() === ADMIN_EMAIL;
  const current = slides[index] ?? slides[0];
  const theme = current ? getHeaderBannerTheme(current) : getHeaderBannerTheme("gray");
  const shouldShow = settings.enabled && slides.length > 0 && (isPreview || !dismissed);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  const goTo = useCallback(
    (next: number | ((currentIndex: number) => number)) => {
      setVisible(false);
      if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
      fadeTimer.current = window.setTimeout(() => {
        setIndex((currentIndex) => {
          const resolved = typeof next === "function" ? next(currentIndex) : next;
          if (slides.length === 0) return 0;
          return (resolved + slides.length) % slides.length;
        });
        setVisible(true);
      }, 140);
    },
    [slides.length]
  );

  useEffect(() => {
    if (!settings.autoRotate || paused || isEditing || slides.length < 2) return;

    const timer = window.setInterval(() => {
      goTo((currentIndex) => currentIndex + 1);
    }, settings.intervalMs);

    return () => window.clearInterval(timer);
  }, [goTo, isEditing, paused, settings.autoRotate, settings.intervalMs, slides.length]);

  const editor = isEditing ? (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-foreground/40 p-4">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-xl md:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">상단 이벤트 배너 수정</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              저장하면 쇼핑몰과 관리자 페이지에 같이 반영됩니다.
            </p>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setIsEditing(false)}
            className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <HeaderBannerEditor
          initial={settings}
          compact
          onSaved={(next) => {
            setSettings(next);
            setDismissed(false);
          }}
        />
      </div>
    </div>
  ) : null;

  if (!shouldShow || !current) {
    return (
      <>
        {canEdit ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="block w-full bg-[#F2F4F6] px-4 py-2.5 text-center text-[13px] font-medium text-[#4E5968]"
          >
            상단 안내 바가 숨겨져 있습니다. 수정하기
          </button>
        ) : null}
        {editor}
      </>
    );
  }

  return (
    <>
      <div
        className="relative transition-[background-color,color] duration-300"
        style={{ backgroundColor: theme.background, color: theme.text }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(event) => {
          const startX = event.changedTouches[0]?.clientX ?? 0;
          const handleEnd = (endEvent: TouchEvent) => {
            const delta = (endEvent.changedTouches[0]?.clientX ?? 0) - startX;
            if (Math.abs(delta) > 40) {
              goTo((currentIndex) => currentIndex + (delta < 0 ? 1 : -1));
            }
            window.removeEventListener("touchend", handleEnd);
          };
          window.addEventListener("touchend", handleEnd, { once: true });
        }}
      >
        <div
          role="region"
          aria-label="이벤트 안내"
          className="container relative flex h-9 items-center justify-center md:h-11"
        >
          {slides.length > 1 ? (
            <button
              type="button"
              aria-label="이전 안내"
              onClick={() => goTo((currentIndex) => currentIndex - 1)}
              className={cn(controlClassName, "absolute left-0 hidden md:grid")}
            >
              <ChevronLeft className="size-4" strokeWidth={2} />
            </button>
          ) : null}

          <Link
            href={resolveHeaderBannerHref(current)}
            className={cn(
              "flex w-full min-w-0 items-center justify-center gap-1.5 px-8 text-center transition-opacity duration-150 active:opacity-70 md:px-14",
              visible ? "opacity-100" : "opacity-0"
            )}
          >
            {current.badge ? (
              <span
                className="inline-flex h-4 shrink-0 items-center rounded-md px-1.5 text-[10px] font-bold leading-none tracking-tight md:h-5 md:px-2 md:text-[11px]"
                style={{
                  backgroundColor: theme.badgeBackground,
                  color: theme.badgeText,
                }}
              >
                {current.badge}
              </span>
            ) : null}
            <span className="truncate text-[12px] font-medium md:text-sm">{current.text}</span>
            <ChevronRight className="size-4 shrink-0 opacity-35" strokeWidth={2} />
          </Link>

          <div className="absolute right-0 flex items-center">
            {slides.length > 1 ? (
              <button
                type="button"
                aria-label="다음 안내"
                onClick={() => goTo((currentIndex) => currentIndex + 1)}
                className={cn(controlClassName, "hidden md:grid")}
              >
                <ChevronRight className="size-4" strokeWidth={2} />
              </button>
            ) : null}
            {canEdit ? (
              <button
                type="button"
                aria-label="상단 배너 수정"
                onClick={() => setIsEditing(true)}
                className={controlClassName}
              >
                <Pencil className="size-3.5" strokeWidth={2} />
              </button>
            ) : null}
            {isPreview ? null : (
              <button
                type="button"
                aria-label="오늘 하루 닫기"
                onClick={() => {
                  dismissHeaderBannerForToday();
                  setDismissed(true);
                }}
                className={controlClassName}
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>
      {editor}
    </>
  );
}
