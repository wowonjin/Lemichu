import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { NewArrivalsCatalog } from "@/components/product/NewArrivalsCatalog";
import { getCatalogProducts } from "@/lib/catalog";
import { catalogFilterTitle, parseCatalogFilter } from "@/lib/catalogFilters";
import {
  filterProductsByAudience,
  filterProductsByPriceBand,
  homeCollectionTitle,
  parseAudienceId,
  parsePriceBandId,
} from "@/lib/homeCollection";

export const revalidate = 15;

type SearchParams = Promise<{
  filter?: string;
  audience?: string;
  band?: string;
  used?: string;
}>;

function resolveCollection(search: {
  filter?: string;
  audience?: string;
  band?: string;
  used?: string;
}) {
  const filter = parseCatalogFilter(search.filter);
  const audienceId = parseAudienceId(search.audience);
  const bandId = parsePriceBandId(search.band);
  const usedOnly = search.used === "1";
  const fallback = catalogFilterTitle(filter);

  return {
    filter,
    audienceId,
    bandId,
    usedOnly,
    title: homeCollectionTitle({ audienceId, bandId, usedOnly, fallback }),
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const search = await searchParams;
  return {
    title: resolveCollection(search).title,
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const search = await searchParams;
  const { filter, audienceId, bandId, usedOnly, title } = resolveCollection(search);
  let products = await getCatalogProducts();

  if (audienceId) {
    products = filterProductsByAudience(products, audienceId);
  }
  if (bandId) {
    products = filterProductsByPriceBand(products, bandId);
  }
  if (usedOnly) {
    products = products.filter((product) => product.isPreOwned);
  }

  return (
    <CustomerPageShell className="bg-background font-sans">
      <NewArrivalsCatalog products={products} filter={filter} title={title} />
    </CustomerPageShell>
  );
}
