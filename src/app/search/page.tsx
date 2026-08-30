import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { SearchTab } from "@/components/search/SearchTab";
import { getCatalogProducts } from "@/lib/catalog";
import { filterProductsByCategoryMenu } from "@/lib/categoryMenu";
import { sortProductsByAvailability } from "@/lib/productAvailability";
import { searchProducts } from "@/lib/productFilter";
import { getSearchDiscovery } from "@/lib/search/discovery";

export const metadata: Metadata = {
  title: "검색",
};

type SearchParams = Promise<{
  q?: string;
  tab?: string;
  category?: string;
  item?: string;
  used?: string;
}>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, tab, category, item, used } = await searchParams;
  const usedOnly = used === "1";
  const hasQuery = Boolean(q || tab || category || item);
  const [catalogProducts, discovery] = await Promise.all([
    getCatalogProducts(),
    hasQuery ? Promise.resolve(undefined) : getSearchDiscovery(),
  ]);
  const results = hasQuery
    ? sortProductsByAvailability(
        tab || category || item
          ? filterProductsByCategoryMenu(catalogProducts, { tab, category, item })
          : searchProducts([q], catalogProducts, { usedOnly })
      )
    : [];

  const breadcrumb = [tab, category, item].filter(Boolean).join(" › ");
  const query = q ?? breadcrumb;

  return (
    <CustomerPageShell className="bg-background p-0 [&>.container]:max-w-none [&>.container]:px-0 [&>.container]:py-0">
      <SearchTab
        initialQuery={query}
        results={results}
        hasQuery={hasQuery}
        usedOnly={usedOnly}
        discovery={discovery}
      />
    </CustomerPageShell>
  );
}
