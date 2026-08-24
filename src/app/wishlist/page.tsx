import { Suspense } from "react";
import type { Metadata } from "next";
import { WishlistCatalog } from "@/components/account/WishlistCatalog";
import { getCatalogProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "찜한 상품 — LEMICHU",
  description:
    "관심 상품의 가격 변동, 재고, 배송 가능 여부를 한눈에 확인하고 편하게 비교하세요.",
};

function WishlistFallback() {
  return (
    <div className="bg-[#F5F5F7] dark:bg-black">
      <div className="mx-auto max-w-[1040px] px-5 pb-24 pt-10 md:px-8 md:pt-16">
        <div className="h-14 w-56 animate-pulse rounded-2xl bg-white dark:bg-[#1C1C1E]" />
        <div className="mt-4 h-6 w-80 max-w-full animate-pulse rounded-xl bg-white dark:bg-[#1C1C1E]" />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[3/4] animate-pulse rounded-md bg-white dark:bg-[#1C1C1E]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function WishlistPage() {
  const products = await getCatalogProducts();

  return (
    <Suspense fallback={<WishlistFallback />}>
      <WishlistCatalog products={products} />
    </Suspense>
  );
}
