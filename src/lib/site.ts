export const SITE_NAME = "레미츄";
export const SITE_TAGLINE = "정품 검수 명품 커머스";
export const SITE_TITLE_DEFAULT = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const SITE_TITLE_TEMPLATE = `${SITE_NAME} - %s`;

export function siteTitle(page: string) {
  const trimmed = page.trim();
  if (!trimmed) return SITE_TITLE_DEFAULT;
  return `${SITE_NAME} - ${trimmed}`;
}

export function productDocumentTitle(brand?: string, name?: string) {
  const trimmedBrand = (brand ?? "").replace(/\s+/g, " ").trim();
  const trimmedName = (name ?? "").replace(/\s+/g, " ").trim();
  if (trimmedBrand && trimmedName.startsWith(trimmedBrand)) return trimmedName;
  return [trimmedBrand, trimmedName].filter(Boolean).join(" ") || "상품";
}
