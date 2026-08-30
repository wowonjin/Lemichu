import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InfoArticle } from "@/components/content/InfoArticle";
import { sellGuides, type SellGuide } from "@/data/pageContent";

type Params = Promise<{ slug: string }>;

function getGuide(slug: string): SellGuide | undefined {
  return (sellGuides as Record<string, SellGuide>)[slug];
}

export function generateStaticParams() {
  return Object.keys(sellGuides).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  return {
    title: guide?.title ?? "판매",
  };
}

export default async function SellGuidePage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    notFound();
  }

  return (
    <div>
      <InfoArticle doc={guide.doc} />

      <div className="container pb-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl bg-foreground p-5 text-center text-background sm:p-8">
          <p className="text-base font-semibold">
            지금 바로 내 명품 시세를 확인해보세요
          </p>
          <Link
            href="/sell"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gold px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            판매 시작하기
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
