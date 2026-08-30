import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CustomerPageHero, CustomerPageShell, CustomerSection, GoldPill } from "@/components/layout/CustomerPage";
import { categories } from "@/data/categories";

export const metadata: Metadata = {
  title: "카테고리",
};

export default function CategoryIndexPage() {
  return (
    <CustomerPageShell>
      <CustomerPageHero
        eyebrow="Category"
        title="카테고리"
        description="원하는 카테고리에서 검수 완료 명품을 메인 섹션처럼 빠르게 탐색하세요."
      >
        <div className="rounded-[1.5rem] bg-foreground p-5 text-background">
          <GoldPill>Luxury Finder</GoldPill>
          <p className="mt-4 text-3xl font-semibold tracking-tight sm:mt-5 sm:text-4xl">
            {categories.length}개
          </p>
          <p className="mt-2 text-sm leading-6 text-background/65">
            가방, 지갑, 슈즈, 시계까지 주요 카테고리를 정리했어요.
          </p>
        </div>
      </CustomerPageHero>

      <CustomerSection className="mt-8">
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={category.href}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-sand p-3.5 transition-colors hover:border-gold/50 hover:bg-gold-soft sm:p-4"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-background text-foreground shadow-sm">
                <category.icon className="size-5" strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {category.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {category.hint}
                </span>
              </span>
              <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
      </CustomerSection>
    </CustomerPageShell>
  );
}
