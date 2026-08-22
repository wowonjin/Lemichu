import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { CategoryFeaturedItems } from "@/components/category/CategoryFeaturedItems";
import { NewArrivalsCatalog } from "@/components/product/NewArrivalsCatalog";
import { getNewArrivalProducts } from "@/lib/catalog";
import { getHomeCategoryById } from "@/lib/home-categories-server";

export const revalidate = 15;

export const metadata: Metadata = {
  title: "오늘출고 — LEMICHU",
};

export default async function NewArrivalsPage() {
  const [newArrivalProducts, content] = await Promise.all([
    getNewArrivalProducts(),
    getHomeCategoryById("today-ship"),
  ]);

  return (
    <CustomerPageShell className="bg-background font-sans">
      {content?.description ? (
        <p className="mb-6 max-w-2xl text-sm leading-6 text-muted-foreground">
          {content.description}
        </p>
      ) : null}
      {content?.items?.length ? (
        <div className="mb-10">
          <CategoryFeaturedItems items={content.items} title="오늘출고 큐레이션" />
        </div>
      ) : null}
      <NewArrivalsCatalog
        title={content?.label ? `${content.label} 상품` : "신규입고 상품"}
        products={newArrivalProducts}
      />
    </CustomerPageShell>
  );
}
