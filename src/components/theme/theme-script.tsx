import Script from "next/script";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const themeBootScript = `
(function () {
  try {
    var root = document.documentElement;
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    localStorage.setItem(${JSON.stringify(THEME_STORAGE_KEY)}, "light");
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return (
    <Script id="lemichu-theme" strategy="beforeInteractive">
      {themeBootScript}
    </Script>
  );
}
