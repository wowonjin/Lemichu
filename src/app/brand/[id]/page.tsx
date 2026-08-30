import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BrandFeatured } from "@/components/brand/BrandFeatured";
import { BrandHero } from "@/components/brand/BrandHero";
import { BrandMoreBrands } from "@/components/brand/BrandMoreBrands";
import { BrandShop } from "@/components/brand/BrandShop";
import { brands } from "@/data/brands";
import { getBrandLogoSrc, rankBrandProducts } from "@/lib/brand-page";
import { getCatalogProducts } from "@/lib/catalog";
import { filterByBrand, getRecommended } from "@/lib/productFilter";

export const revalidate = 15;

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return brands.map((brand) => ({ id: brand.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const brand = brands.find((item) => item.id === id);
  return {
    title: brand?.name ?? "브랜드",
    description: brand
      ? `${brand.name} 검수 완료 상품을 한눈에 비교하세요.`
      : "브랜드 상품을 한눈에 비교하세요.",
  };
}

export default async function BrandDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const brand = brands.find((item) => item.id === id);

  if (!brand) {
    notFound();
  }

  const catalogProducts = await getCatalogProducts();
  const products = filterByBrand(brand.name, catalogProducts);
  const featured = rankBrandProducts(products).slice(0, 4);
  const recommended = products.length > 0 ? [] : getRecommended(8, catalogProducts);

  return (
    <>
      <BrandHero
        brand={brand}
        productCount={products.length}
        logoSrc={getBrandLogoSrc(brand.id)}
      />
      {products.length > 4 ? (
        <BrandFeatured brandName={brand.name} products={featured} />
      ) : null}
      <BrandShop
        brandName={brand.name}
        products={products}
        recommended={recommended}
      />
      <BrandMoreBrands currentId={brand.id} />
    </>
  );
}
