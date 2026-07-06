import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { NewArrivalsCatalog } from "@/components/product/NewArrivalsCatalog";
import { getNewArrivalProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "신규입고 — LEMICHU",
};

export default async function NewArrivalsPage() {
  const newArrivalProducts = await getNewArrivalProducts();

  return (
    <CustomerPageShell className="bg-white bg-none font-sans">
      <NewArrivalsCatalog products={newArrivalProducts} />
    </CustomerPageShell>
  );
}
