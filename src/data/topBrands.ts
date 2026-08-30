import { brands } from "@/data/brands";

export type TopBrand = {
  id: string;
  name: string;
  wordmark: string;
  href: string;
  logoSrc: string;
};

const TOP_BRAND_LOGOS = [
  { id: "prada", logoSrc: "/brand-logos/prada.png?v=cutout" },
  { id: "celine", logoSrc: "/brand-logos/celine.png?v=cutout" },
  { id: "saint-laurent", logoSrc: "/brand-logos/saint-laurent.png?v=cutout" },
  { id: "maison-margiela", logoSrc: "/brand-logos/maison-margiela.png?v=cutout" },
  { id: "gucci", logoSrc: "/brand-logos/gucci.png?v=cutout" },
  { id: "ferragamo", logoSrc: "/brand-logos/ferragamo.png?v=cutout" },
] as const;

export const topBrands: TopBrand[] = TOP_BRAND_LOGOS.map((item) => {
  const brand = brands.find((entry) => entry.id === item.id);
  if (!brand) {
    throw new Error(`Missing brand definition for ${item.id}`);
  }
  return {
    id: brand.id,
    name: brand.name,
    wordmark: brand.wordmark,
    href: brand.href,
    logoSrc: item.logoSrc,
  };
});
