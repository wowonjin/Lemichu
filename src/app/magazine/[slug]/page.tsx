import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { InfoArticle } from "@/components/content/InfoArticle";
import { magazineArticles } from "@/data/pageContent";
import { magazineItems } from "@/data/campaigns";
import { getTemporaryImageUrl } from "@/lib/placeholder";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return Object.keys(magazineArticles).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = magazineArticles[slug];
  return {
    title: article ? `${article.title} — LEMICHU` : "매거진 — LEMICHU",
  };
}

export default async function MagazineArticlePage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const article = magazineArticles[slug];

  if (!article) {
    notFound();
  }

  const meta = magazineItems.find((item) => item.href === `/magazine/${slug}`);

  return (
    <div>
      <div className="container pt-6">
        <Link
          href="/magazine"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          매거진
        </Link>
      </div>

      {meta ? (
        <div className="container mt-4">
          <div className="relative aspect-[16/7] overflow-hidden rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getTemporaryImageUrl(meta.seed)}
              alt={article.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute left-4 top-4 rounded-md bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
              {meta.category}
            </span>
          </div>
        </div>
      ) : null}

      <InfoArticle doc={article} />
    </div>
  );
}
