import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { NewArrivalsCatalog } from "@/components/product/NewArrivalsCatalog";
import { getCatalogProducts } from "@/lib/catalog";
import { catalogFilterTitle, parseCatalogFilter } from "@/lib/catalogFilters";

export const revalidate = 15;

type SearchParams = Promise<{ filter?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { filter } = await searchParams;
  return {
    title: catalogFilterTitle(parseCatalogFilter(filter)),
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { filter } = await searchParams;
  const products = await getCatalogProducts();

  return (
    <CustomerPageShell className="bg-background font-sans">
      <NewArrivalsCatalog products={products} filter={parseCatalogFilter(filter)} />
    </CustomerPageShell>
  );
}
