import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CustomerPageHero, CustomerPageShell, CustomerSection, GoldPill } from "@/components/layout/CustomerPage";
import { ProductGrid } from "@/components/product/ProductGrid";
import { categories } from "@/data/categories";
import { getCatalogProducts } from "@/lib/catalog";
import { filterByCategory, getRecommended } from "@/lib/productFilter";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return categories.map((category) => ({ id: category.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const category = categories.find((c) => c.id === id);
  return {
    title: category ? `${category.label} — LEMICHU` : "카테고리 — LEMICHU",
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const category = categories.find((c) => c.id === id);

  if (!category) {
    notFound();
  }

  const catalogProducts = await getCatalogProducts();
  const products = filterByCategory(category.id, catalogProducts);

  return (
    <CustomerPageShell>
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/category" className="transition-colors hover:text-foreground">
          카테고리
        </Link>
        <span>›</span>
        <span className="text-foreground">{category.label}</span>
      </nav>

      <CustomerPageHero
        eyebrow="Category"
        title={category.label}
        description={`${category.hint} 카테고리의 검수 완료 명품 ${products.length}개를 확인하세요.`}
        className="mt-5"
      >
        <div className="rounded-[1.5rem] bg-foreground p-5 text-background">
          <GoldPill>{category.hint}</GoldPill>
          <p className="mt-5 text-4xl font-semibold tracking-tight">
            {products.length}개
          </p>
          <p className="mt-2 text-sm leading-6 text-background/65">
            메인 카드와 같은 구조로 상품을 비교할 수 있어요.
          </p>
        </div>
      </CustomerPageHero>

      <CustomerSection className="mt-8">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div>
            <div className="rounded-2xl border border-border bg-sand p-8 text-center">
              <p className="text-sm font-semibold text-foreground">
                아직 등록된 상품이 없어요.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                대신 지금 인기 있는 상품을 추천해드릴게요.
              </p>
            </div>
            <div className="mt-8">
              <ProductGrid products={getRecommended(8, catalogProducts)} />
            </div>
          </div>
        )}
      </CustomerSection>
    </CustomerPageShell>
  );
}
