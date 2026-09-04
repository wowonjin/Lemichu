import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { InfoArticle } from "@/components/content/InfoArticle";
import { getNoticePost, noticePosts } from "@/data/notices";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return noticePosts.map((notice) => ({ slug: notice.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const notice = getNoticePost(slug);

  return {
    title: notice?.title ?? "공지사항",
  };
}

export default async function NoticePostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const notice = getNoticePost(slug);

  if (!notice) {
    notFound();
  }

  return (
    <div className="bg-background">
      <div className="container pt-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground md:text-sm">
          <Link
            href="/notices"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            공지사항
          </Link>
          <span aria-hidden="true">·</span>
          <span>{notice.category}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={notice.date.replaceAll(".", "-")}>{notice.date}</time>
        </div>
      </div>

      <InfoArticle doc={notice.doc} />

      {notice.cta ? (
        <div className="container pb-10 md:pb-14">
          <div className="mx-auto max-w-3xl">
            <Link
              href={notice.cta.href}
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {notice.cta.label}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
