import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AccountPageShell, AccountSkeleton } from "@/components/account/AccountPageShell";
import { AccountSectionViews } from "@/components/account/AccountSectionViews";
import { mySections, type MySectionKind } from "@/data/pageContent";
import { getCatalogProducts } from "@/lib/catalog";

type Params = Promise<{ section: string }>;

function isMySection(value: string): value is MySectionKind {
  return value in mySections;
}

export function generateStaticParams() {
  return Object.keys(mySections).map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { section } = await params;
  const meta = isMySection(section) ? mySections[section] : undefined;
  return {
    title: meta ? `${meta.title} — LEMICHU` : "마이페이지 — LEMICHU",
  };
}

export default async function MySectionPage({
  params,
}: {
  params: Params;
}) {
  const { section } = await params;

  if (!isMySection(section)) {
    notFound();
  }

  const meta = mySections[section];
  const products = await getCatalogProducts();

  return (
    <AccountPageShell currentLabel={meta.title}>
      <header className="mb-5">
        <h1 className="text-[26px] font-bold tracking-tight text-foreground">{meta.title}</h1>
        <p className="mt-1.5 text-[14px] leading-6 text-muted-foreground">{meta.description}</p>
      </header>
      <Suspense fallback={<AccountSkeleton rows={4} />}>
        <AccountSectionViews section={section} products={products} />
      </Suspense>
    </AccountPageShell>
  );
}
