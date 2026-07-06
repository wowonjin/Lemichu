import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { SearchTab } from "@/components/search/SearchTab";
import { getCatalogProducts } from "@/lib/catalog";
import { searchProducts } from "@/lib/productFilter";

export const metadata: Metadata = {
  title: "검색 — LEMICHU",
};

type SearchParams = Promise<{
  q?: string;
  tab?: string;
  category?: string;
  item?: string;
}>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, tab, category, item } = await searchParams;
  const hasQuery = Boolean(q || tab || category || item);
  const catalogProducts = await getCatalogProducts();
  const results = hasQuery ? searchProducts([q, item, category], catalogProducts) : [];

  const breadcrumb = [tab, category, item].filter(Boolean).join(" › ");
  const query = q ?? breadcrumb;

  return (
    <CustomerPageShell className="bg-white bg-none p-0 [&>.container]:max-w-none [&>.container]:px-0 [&>.container]:py-0">
      <SearchTab initialQuery={query} results={results} hasQuery={hasQuery} />
    </CustomerPageShell>
  );
}
