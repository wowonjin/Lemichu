import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { NewArrivalsCatalog } from "@/components/product/NewArrivalsCatalog";
import { getPreOwnedProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "중고명품 — LEMICHU",
};

export default async function PreOwnedPage() {
  const products = await getPreOwnedProducts();

  return (
    <CustomerPageShell className="bg-white bg-none font-sans">
      <NewArrivalsCatalog title="중고명품 상품" products={products} />
    </CustomerPageShell>
  );
}
