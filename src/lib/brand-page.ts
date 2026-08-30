import { topBrands } from "@/data/topBrands";
import type { Product } from "@/types/product";

const BRAND_LOGOS: Record<string, string> = {
  chanel: "/brand-logos/chanel.png",
  "chrome-hearts": "/brand-logos/chrome-hearts.png",
  "louis-vuitton": "/brand-logos/louis-vuitton.png",
  cartier: "/brand-logos/cartier.png",
  hermes: "/brand-logos/hermes.png",
  dior: "/brand-logos/dior.png",
  prada: "/brand-logos/prada.png",
  celine: "/brand-logos/celine.png",
  "saint-laurent": "/brand-logos/saint-laurent.png",
  "maison-margiela": "/brand-logos/maison-margiela.png",
  gucci: "/brand-logos/gucci.png",
  ferragamo: "/brand-logos/ferragamo.png",
};

export const brandPriceBands = [
  { id: "all", label: "전체" },
  { id: "under-200", label: "200만원 이하", max: 2_000_000 },
  { id: "200-500", label: "200–500만원", min: 2_000_000, max: 5_000_000 },
  { id: "over-500", label: "500만원 이상", min: 5_000_000 },
] as const;

export type BrandPriceBandId = (typeof brandPriceBands)[number]["id"];

export function getBrandLogoSrc(brandId: string) {
  return BRAND_LOGOS[brandId] ?? topBrands.find((item) => item.id === brandId)?.logoSrc;
}

export function rankBrandProducts(products: Product[]) {
  return [...products].sort((left, right) => {
    const created = (right.createdAt ?? 0) - (left.createdAt ?? 0);
    if (created) return created;
    const discount = (right.discountRate ?? 0) - (left.discountRate ?? 0);
    if (discount) return discount;
    return left.price - right.price;
  });
}

export function productMatchesPriceBand(product: Product, id: BrandPriceBandId) {
  const band = brandPriceBands.find((item) => item.id === id);
  if (!band || band.id === "all") return true;
  if ("min" in band && band.min !== undefined && product.price < band.min) return false;
  if ("max" in band && band.max !== undefined && product.price >= band.max) return false;
  return true;
}
