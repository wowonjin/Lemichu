export const THEME_STORAGE_KEY = "lemichu-theme";

export type Theme = "light" | "dark";

export const THEME_COLOR = {
  light: "#ffffff",
  dark: "#121212",
} as const;

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme]);
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : null;
}
