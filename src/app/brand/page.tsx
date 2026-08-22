import type { Metadata } from "next";
import Link from "next/link";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { brands } from "@/data/brands";

export const metadata: Metadata = {
  title: "브랜드 — LEMICHU",
};

export default function BrandPage() {
  return (
    <CustomerPageShell className="bg-background font-sans">
      <section>
        <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-end md:justify-between">
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            브랜드
          </h2>
        </div>
        <div className="mb-6 mt-3 text-sm text-muted-foreground">
          총 {brands.length}개 브랜드
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Link
                href={brand.href}
                className="flex h-28 flex-col items-center justify-center gap-1 bg-transparent transition-colors hover:bg-secondary"
              >
                <span className="text-base font-semibold tracking-wide text-foreground">
                  {brand.wordmark}
                </span>
                <span className="text-xs text-muted-foreground">{brand.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </CustomerPageShell>
  );
}
