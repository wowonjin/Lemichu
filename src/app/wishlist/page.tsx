import type { Metadata } from "next";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { NewArrivalsCatalog } from "@/components/product/NewArrivalsCatalog";
import { getCatalogProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "찜한 상품 — LEMICHU",
  description:
    "관심 상품의 가격 변동, 재고, 배송 가능 여부를 한눈에 확인하고 편하게 비교하세요.",
};

export default async function WishlistPage() {
  const wishedProducts = (await getCatalogProducts()).slice(0, 8);

  return (
    <CustomerPageShell className="bg-white bg-none font-sans">
      <NewArrivalsCatalog title="찜한 상품" products={wishedProducts} />
    </CustomerPageShell>
  );
}
