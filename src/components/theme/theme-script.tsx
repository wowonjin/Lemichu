import Script from "next/script";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const themeBootScript = `
(function () {
  try {
    var theme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (theme !== "dark" && theme !== "light") theme = "light";
    var root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
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
