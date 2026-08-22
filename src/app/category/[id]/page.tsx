import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CustomerPageHero, CustomerPageShell, CustomerSection, GoldPill } from "@/components/layout/CustomerPage";
import { CategoryFeaturedItems } from "@/components/category/CategoryFeaturedItems";
import { ProductGrid } from "@/components/product/ProductGrid";
import { categories } from "@/data/categories";
import { getCatalogProducts } from "@/lib/catalog";
import { getHomeCategoryById } from "@/lib/home-categories-server";
import { filterByCategory, getRecommended } from "@/lib/productFilter";

export const revalidate = 15;

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
  const [category, content] = await Promise.all([
    Promise.resolve(categories.find((item) => item.id === id)),
    getHomeCategoryById(id),
  ]);
  const title = content?.label ?? category?.label;
  return {
    title: title ? `${title} — LEMICHU` : "카테고리 — LEMICHU",
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const category = categories.find((item) => item.id === id);

  if (!category) {
    notFound();
  }

  const [catalogProducts, content] = await Promise.all([
    getCatalogProducts(),
    getHomeCategoryById(id),
  ]);
  const products = filterByCategory(category.id, catalogProducts);
  const title = content?.label ?? category.label;
  const description =
    content?.description ??
    `${category.hint} 카테고리의 검수 완료 명품 ${products.length}개를 확인하세요.`;

  return (
    <CustomerPageShell>
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/category" className="transition-colors hover:text-foreground">
          카테고리
        </Link>
        <span>›</span>
        <span className="text-foreground">{title}</span>
      </nav>

      <CustomerPageHero
        eyebrow="Category"
        title={title}
        description={description}
        className="mt-5"
      >
        {content?.imageSrc ? (
          <div className="relative overflow-hidden rounded-[1.5rem] bg-[#f4f6f8]">
            <div className="relative aspect-[4/3]">
              <Image
                src={content.imageSrc}
                alt={title}
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-contain p-8"
              />
            </div>
            <p className="absolute bottom-4 left-4 rounded-full bg-foreground/80 px-3 py-1 text-xs font-semibold text-background">
              {products.length}개 상품
            </p>
          </div>
        ) : (
          <div className="rounded-[1.5rem] bg-foreground p-5 text-background">
            <GoldPill>{category.hint}</GoldPill>
            <p className="mt-5 text-4xl font-semibold tracking-tight">{products.length}개</p>
            <p className="mt-2 text-sm leading-6 text-background/65">
              메인 카드와 같은 구조로 상품을 비교할 수 있어요.
            </p>
          </div>
        )}
      </CustomerPageHero>

      {content?.items?.length ? (
        <CustomerSection className="mt-8">
          <CategoryFeaturedItems items={content.items} title="이 카테고리 큐레이션" />
        </CustomerSection>
      ) : null}

      <CustomerSection className="mt-8">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div>
            <div className="rounded-2xl border border-border bg-sand p-8 text-center">
              <p className="text-sm font-semibold text-foreground">아직 등록된 상품이 없어요.</p>
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
