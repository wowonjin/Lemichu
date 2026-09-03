"use client";

import { adminRequestHeaders } from "@/lib/admin-client";
import {
  DEFAULT_HEADER_BANNER,
  HEADER_BANNER_CHANGE_EVENT,
  HEADER_BANNER_DISMISS_KEY,
  HEADER_BANNER_STORAGE_KEY,
  normalizeHeaderBanner,
  todayDismissKey,
  type HeaderBannerSettings,
} from "@/lib/headerBanner";

export function isHeaderBannerDismissedToday() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(HEADER_BANNER_DISMISS_KEY) === todayDismissKey();
}

export function dismissHeaderBannerForToday() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HEADER_BANNER_DISMISS_KEY, todayDismissKey());
}

function persistLocalHeaderBanner(settings: HeaderBannerSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HEADER_BANNER_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(HEADER_BANNER_CHANGE_EVENT, { detail: settings }));
}

export function readLocalHeaderBanner(): HeaderBannerSettings | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(HEADER_BANNER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return normalizeHeaderBanner(JSON.parse(raw));
  } catch {
    window.localStorage.removeItem(HEADER_BANNER_STORAGE_KEY);
    return null;
  }
}

export async function saveHeaderBanner(settings: HeaderBannerSettings) {
  const normalized = normalizeHeaderBanner(settings);
  persistLocalHeaderBanner(normalized);

  const response = await fetch("/api/site/header-banner", {
    method: "PUT",
    headers: await adminRequestHeaders(),
    body: JSON.stringify(normalized),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(result.message || "상단 배너를 저장하지 못했어요.");
  }

  return { persisted: "api" as const, settings: normalized };
}

export function observeHeaderBanner(onChange: (settings: HeaderBannerSettings) => void) {
  if (typeof window === "undefined") {
    onChange(DEFAULT_HEADER_BANNER);
    return () => undefined;
  }

  let active = true;
  onChange(readLocalHeaderBanner() ?? DEFAULT_HEADER_BANNER);

  fetch("/api/site/header-banner")
    .then((response) => response.json())
    .then((payload: { settings?: unknown; stored?: boolean }) => {
      if (!active || !payload.settings) return;
      const settings = normalizeHeaderBanner(payload.settings);
      persistLocalHeaderBanner(settings);
      onChange(settings);
    })
    .catch(() => undefined);

  const handleLocalChange = (event: Event) => {
    const detail = (event as CustomEvent<HeaderBannerSettings>).detail;
    if (detail) onChange(normalizeHeaderBanner(detail));
  };

  window.addEventListener(HEADER_BANNER_CHANGE_EVENT, handleLocalChange);

  return () => {
    active = false;
    window.removeEventListener(HEADER_BANNER_CHANGE_EVENT, handleLocalChange);
  };
}
