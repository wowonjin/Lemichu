export const HEADER_BANNER_THEME_IDS = [
  "blue",
  "mint",
  "amber",
  "peach",
  "rose",
  "violet",
  "navy",
  "gray",
] as const;

export type HeaderBannerThemeId = (typeof HEADER_BANNER_THEME_IDS)[number];

export type HeaderBannerTheme = {
  id: HeaderBannerThemeId;
  label: string;
  background: string;
  text: string;
  muted: string;
  badgeBackground: string;
  badgeText: string;
  accent: string;
  iconBackground: string;
  orb: string;
  shadow: string;
};

export type HeaderBannerSlide = {
  id: string;
  badge: string;
  text: string;
  href: string;
  enabled: boolean;
  theme: HeaderBannerThemeId;
};

export type HeaderBannerSettings = {
  enabled: boolean;
  autoRotate: boolean;
  intervalMs: number;
  backgroundColor: string;
  textColor: string;
  slides: HeaderBannerSlide[];
};

export const HEADER_BANNER_DOC_PATH = ["siteSettings", "headerBanner"] as const;
export const HEADER_BANNER_STORAGE_KEY = "lemichu-header-banner";
export const HEADER_BANNER_DISMISS_KEY = "lemichu-header-banner-dismissed";
export const HEADER_BANNER_CHANGE_EVENT = "lemichu-header-banner-change";
export const HEADER_BANNER_ADMIN_EMAIL = "admin@gmail.com";

const SOFT_SHADOW = "inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 10px rgba(15,23,42,0.06)";
const DARK_SHADOW = "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 14px rgba(15,23,42,0.16)";

export const HEADER_BANNER_THEMES: Record<HeaderBannerThemeId, HeaderBannerTheme> = {
  blue: {
    id: "blue",
    label: "블루",
    background: "#E8F3FF",
    text: "#1B64DA",
    muted: "#4B8DE3",
    badgeBackground: "#3182F6",
    badgeText: "#FFFFFF",
    accent: "#3182F6",
    iconBackground: "rgba(49,130,246,0.14)",
    orb: "rgba(49,130,246,0.2)",
    shadow: SOFT_SHADOW,
  },
  mint: {
    id: "mint",
    label: "민트",
    background: "#E6F8F1",
    text: "#0C7A56",
    muted: "#2F9E78",
    badgeBackground: "#00A86B",
    badgeText: "#FFFFFF",
    accent: "#00A86B",
    iconBackground: "rgba(0,168,107,0.14)",
    orb: "rgba(0,168,107,0.18)",
    shadow: SOFT_SHADOW,
  },
  amber: {
    id: "amber",
    label: "앰버",
    background: "#FFF6DE",
    text: "#A16207",
    muted: "#CA8A04",
    badgeBackground: "#F5A524",
    badgeText: "#191F28",
    accent: "#F5A524",
    iconBackground: "rgba(245,165,36,0.2)",
    orb: "rgba(245,165,36,0.22)",
    shadow: SOFT_SHADOW,
  },
  peach: {
    id: "peach",
    label: "피치",
    background: "#FFF1E8",
    text: "#C2410C",
    muted: "#EA580C",
    badgeBackground: "#FF6B2C",
    badgeText: "#FFFFFF",
    accent: "#FF6B2C",
    iconBackground: "rgba(255,107,44,0.14)",
    orb: "rgba(255,107,44,0.2)",
    shadow: SOFT_SHADOW,
  },
  rose: {
    id: "rose",
    label: "로즈",
    background: "#FFECEE",
    text: "#C2343A",
    muted: "#E1555C",
    badgeBackground: "#F04452",
    badgeText: "#FFFFFF",
    accent: "#F04452",
    iconBackground: "rgba(240,68,82,0.12)",
    orb: "rgba(240,68,82,0.16)",
    shadow: SOFT_SHADOW,
  },
  violet: {
    id: "violet",
    label: "바이올렛",
    background: "#F3ECFF",
    text: "#6D28D9",
    muted: "#8B5CF6",
    badgeBackground: "#8B5CF6",
    badgeText: "#FFFFFF",
    accent: "#8B5CF6",
    iconBackground: "rgba(139,92,246,0.14)",
    orb: "rgba(139,92,246,0.18)",
    shadow: SOFT_SHADOW,
  },
  navy: {
    id: "navy",
    label: "네이비",
    background: "#191F28",
    text: "#FFFFFF",
    muted: "#B0B8C1",
    badgeBackground: "#3182F6",
    badgeText: "#FFFFFF",
    accent: "#69B1FF",
    iconBackground: "rgba(255,255,255,0.1)",
    orb: "rgba(49,130,246,0.28)",
    shadow: DARK_SHADOW,
  },
  gray: {
    id: "gray",
    label: "그레이",
    background: "#F2F4F6",
    text: "#191F28",
    muted: "#4E5968",
    badgeBackground: "#191F28",
    badgeText: "#FFFFFF",
    accent: "#4E5968",
    iconBackground: "rgba(25,31,40,0.08)",
    orb: "rgba(78,89,104,0.12)",
    shadow: SOFT_SHADOW,
  },
};

export const HEADER_BANNER_COLOR_PRESETS = HEADER_BANNER_THEME_IDS.map((id) => {
  const theme = HEADER_BANNER_THEMES[id];
  return {
    label: theme.label,
    theme: id,
    backgroundColor: theme.background,
    textColor: theme.text,
  };
});

const DEFAULT_SLIDE_THEMES: Record<string, HeaderBannerThemeId> = {
  "welcome-coupon": "blue",
  "ss-new": "violet",
  "summer-week": "peach",
  "free-shipping": "mint",
  "guarantee": "navy",
  "first-purchase": "rose",
};

export const DEFAULT_HEADER_BANNER: HeaderBannerSettings = {
  enabled: true,
  autoRotate: true,
  intervalMs: 4000,
  backgroundColor: HEADER_BANNER_THEMES.blue.background,
  textColor: HEADER_BANNER_THEMES.blue.text,
  slides: [
    {
      id: "welcome-coupon",
      badge: "쿠폰",
      text: "신규가입 즉시 5,000원 쿠폰 받기",
      href: "/signup",
      enabled: true,
      theme: "blue",
    },
    {
      id: "ss-new",
      badge: "신상",
      text: "27SS 신상 할인 상품 구경하기",
      href: "/new-arrivals",
      enabled: true,
      theme: "violet",
    },
    {
      id: "summer-week",
      badge: "특가",
      text: "여름 특가 위크, 시즌 인기 명품 특가",
      href: "/events/summer-special-week",
      enabled: true,
      theme: "peach",
    },
    {
      id: "free-shipping",
      badge: "혜택",
      text: "전상품 무료배송 · 관부가세 포함가",
      href: "/policy/delivery",
      enabled: true,
      theme: "mint",
    },
    {
      id: "guarantee",
      badge: "보장",
      text: "가품 판정 시 결제금액 200% 보상",
      href: "/policy/guarantee",
      enabled: true,
      theme: "navy",
    },
    {
      id: "first-purchase",
      badge: "신규",
      text: "첫 구매 정품 검수비 무료 혜택",
      href: "/events/welcome-first-purchase",
      enabled: true,
      theme: "rose",
    },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function clampInterval(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_HEADER_BANNER.intervalMs;
  return Math.min(15_000, Math.max(2_000, Math.round(parsed)));
}

function normalizeHex(value: unknown, fallback: string) {
  const raw = asString(value, fallback).trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
    return raw.length === 4
      ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
      : raw;
  }
  return fallback;
}

function createSlideId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isHeaderBannerThemeId(value: unknown): value is HeaderBannerThemeId {
  return typeof value === "string" && HEADER_BANNER_THEME_IDS.includes(value as HeaderBannerThemeId);
}

export function resolveHeaderBannerThemeId(
  slide: { id?: string; theme?: unknown },
  index = 0
): HeaderBannerThemeId {
  if (isHeaderBannerThemeId(slide.theme)) return slide.theme;
  if (slide.id && DEFAULT_SLIDE_THEMES[slide.id]) return DEFAULT_SLIDE_THEMES[slide.id];
  return HEADER_BANNER_THEME_IDS[index % HEADER_BANNER_THEME_IDS.length];
}

export function getHeaderBannerTheme(
  slide: Pick<HeaderBannerSlide, "theme"> | HeaderBannerThemeId
): HeaderBannerTheme {
  const themeId = typeof slide === "string" ? slide : slide.theme;
  return HEADER_BANNER_THEMES[themeId] ?? HEADER_BANNER_THEMES.blue;
}

export function nextHeaderBannerTheme(used: Iterable<HeaderBannerThemeId>): HeaderBannerThemeId {
  const usedSet = new Set(used);
  return (
    HEADER_BANNER_THEME_IDS.find((theme) => !usedSet.has(theme)) ??
    HEADER_BANNER_THEME_IDS[usedSet.size % HEADER_BANNER_THEME_IDS.length]
  );
}

export function createEmptyHeaderBannerSlide(
  theme: HeaderBannerThemeId = "blue"
): HeaderBannerSlide {
  return {
    id: createSlideId(),
    badge: "EVENT",
    text: "",
    href: "/",
    enabled: true,
    theme,
  };
}

export function normalizeHeaderBanner(value: unknown): HeaderBannerSettings {
  const source = isRecord(value) ? value : {};
  const slides = Array.isArray(source.slides)
    ? source.slides
        .filter(isRecord)
        .map((slide, index) => ({
          id: asString(slide.id, `slide-${index + 1}`),
          badge: asString(slide.badge).trim(),
          text: asString(slide.text).trim(),
          href: asString(slide.href, "/").trim() || "/",
          enabled: asBoolean(slide.enabled, true),
          theme: resolveHeaderBannerThemeId(slide, index),
        }))
        .filter((slide) => slide.text)
    : DEFAULT_HEADER_BANNER.slides;

  const resolvedSlides = slides.length > 0 ? slides : DEFAULT_HEADER_BANNER.slides;
  const firstTheme = getHeaderBannerTheme(resolvedSlides[0]);

  return {
    enabled: asBoolean(source.enabled, true),
    autoRotate: asBoolean(source.autoRotate, true),
    intervalMs: clampInterval(source.intervalMs),
    backgroundColor: normalizeHex(source.backgroundColor, firstTheme.background),
    textColor: normalizeHex(source.textColor, firstTheme.text),
    slides: resolvedSlides,
  };
}

export function getVisibleHeaderBannerSlides(settings: HeaderBannerSettings) {
  return settings.slides.filter((slide) => slide.enabled && slide.text.trim());
}

export function todayDismissKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function canManageHeaderBanner(email?: string | null) {
  return email?.toLowerCase() === HEADER_BANNER_ADMIN_EMAIL;
}
