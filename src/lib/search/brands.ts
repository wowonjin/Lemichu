import { brands } from "@/data/brands";
import { buildSearchHref } from "@/lib/search/url";

export function findBrandByName(name: string) {
  const target = name.trim().toLowerCase();
  if (!target) return undefined;

  return brands.find((brand) => {
    const aliases = (brand.aliases ?? []).map((alias) => alias.toLowerCase());
    return (
      brand.name.toLowerCase() === target ||
      brand.wordmark.toLowerCase() === target ||
      brand.id.replace(/-/g, " ") === target ||
      aliases.includes(target)
    );
  });
}

export function brandHrefForSearch(name: string, usedOnly = false) {
  const brand = findBrandByName(name);
  if (brand && !usedOnly) return brand.href;
  return buildSearchHref(name, { used: usedOnly });
}
