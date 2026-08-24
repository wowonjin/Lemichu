import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { magazineItems } from "@/data/campaigns";
import { getTemporaryImageUrl } from "@/lib/placeholder";

export const metadata: Metadata = {
  title: "매거진",
};

export default function MagazinePage() {
  return (
    <div className="container py-8 md:py-10">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        레미츄 매거진
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        명품을 더 잘 사고 즐기는 법, 레미츄가 안내합니다.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {magazineItems.map((item) => (
          <Link key={item.id} href={item.href} className="group block">
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getTemporaryImageUrl(item.seed)}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded-md bg-background/85 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur">
                {item.category}
              </span>
              <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-md bg-background/85 text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <ArrowUpRight className="size-4" />
              </span>
            </div>
            <h2 className="mt-3 text-sm font-semibold leading-snug text-foreground">
              {item.title}
            </h2>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {item.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
