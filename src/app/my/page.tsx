import type { Metadata } from "next";
import { AccountPageShell } from "@/components/account/AccountPageShell";
import { MyDashboard } from "@/components/account/MyDashboard";
import { getCatalogProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "마이페이지 — LEMICHU",
};

export default async function MyPage() {
  const products = await getCatalogProducts();

  return (
    <AccountPageShell currentLabel="홈">
      <MyDashboard products={products} />
    </AccountPageShell>
  );
}
