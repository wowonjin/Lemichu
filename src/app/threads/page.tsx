import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { NewArrivalsCatalog } from "@/components/product/NewArrivalsCatalog";
import { getNewArrivalProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Threads 인기 — LEMICHU",
};

export default async function ThreadsPage() {
  const products = await getNewArrivalProducts();

  return (
    <CustomerPageShell className="bg-background font-sans">
      <NewArrivalsCatalog title="Threads 인기 상품" products={products} />
    </CustomerPageShell>
  );
}
