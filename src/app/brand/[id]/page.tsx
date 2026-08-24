import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CustomerPageHero, CustomerPageShell, CustomerSection, GoldPill } from "@/components/layout/CustomerPage";
import { ProductGrid } from "@/components/product/ProductGrid";
import { brands } from "@/data/brands";
import { getCatalogProducts } from "@/lib/catalog";
import { filterByBrand, getRecommended } from "@/lib/productFilter";

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
  const brand = brands.find((b) => b.id === id);
  return {
    title: brand?.name ?? "브랜드",
  };
}

export default async function BrandDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const brand = brands.find((b) => b.id === id);

  if (!brand) {
    notFound();
  }

  const catalogProducts = await getCatalogProducts();
  const products = filterByBrand(brand.name, catalogProducts);

  return (
    <CustomerPageShell>
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/brand" className="transition-colors hover:text-foreground">
          브랜드관
        </Link>
        <span>›</span>
        <span className="text-foreground">{brand.name}</span>
      </nav>

      <CustomerPageHero
        eyebrow="Brand"
        title={brand.wordmark}
        description={`${brand.name}의 검수 완료 상품을 한눈에 비교하세요.`}
        className="mt-5"
      >
        <div className="rounded-[1.5rem] bg-sand p-5">
          <GoldPill>{brand.name}</GoldPill>
          <p className="mt-5 text-4xl font-semibold tracking-tight text-foreground">
            {products.length}개
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            현재 준비된 브랜드 상품 수입니다.
          </p>
        </div>
      </CustomerPageHero>

      <CustomerSection className="mt-8">
        <div className="flex items-end justify-between gap-4">
        <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
          {brand.name} 상품
        </h1>
        <span className="text-sm text-muted-foreground">{products.length}개</span>
      </div>

      <div className="mt-5">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div>
            <div className="rounded-2xl border border-border bg-sand p-8 text-center">
              <p className="text-sm font-semibold text-foreground">
                {brand.name} 상품을 준비 중이에요.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                다른 인기 상품을 먼저 둘러보세요.
              </p>
            </div>
            <div className="mt-8">
              <ProductGrid products={getRecommended(8, catalogProducts)} />
            </div>
          </div>
        )}
      </div>
      </CustomerSection>
    </CustomerPageShell>
  );
}
