import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { NewArrivalsCatalog } from "@/components/product/NewArrivalsCatalog";
import { getRankedProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "랭킹 — LEMICHU",
};

export default async function RankingPage() {
  const products = await getRankedProducts();

  return (
    <CustomerPageShell className="bg-white bg-none font-sans">
      <NewArrivalsCatalog title="BEST 상품" products={products} />
    </CustomerPageShell>
  );
}
