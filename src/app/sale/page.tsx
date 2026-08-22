import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { NewArrivalsCatalog } from "@/components/product/NewArrivalsCatalog";
import { getSaleProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "SALE — LEMICHU",
};

export default async function SalePage() {
  const products = await getSaleProducts();

  return (
    <CustomerPageShell className="bg-background font-sans">
      <NewArrivalsCatalog title="SALE 상품" products={products} />
    </CustomerPageShell>
  );
}
