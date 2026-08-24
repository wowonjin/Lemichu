import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/formatPrice";
import type { Product } from "@/types/product";

export function HomeHero({ products }: { products: Product[] }) {
  const mosaic = products.slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-sand">
      <div className="container grid items-center gap-10 py-12 md:grid-cols-[1.05fr_0.95fr] md:py-16">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">
            Verified Luxury
          </p>
          <h1 className="mt-4 text-balance font-serif text-3xl font-semibold leading-[1.25] tracking-tight text-foreground md:text-[2.75rem] md:leading-[1.2]">
            검수된 명품을,
            <br />
            관부가세 걱정 없이
          </h1>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            신상부터 중고까지 검수 결과와 배송 가능일을 먼저 확인하세요.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/products">
                이번 주 베스트 보기
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/products?filter=new">오늘 출고 상품 보기</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {mosaic.map((product) => (
            <Link
              key={product.id}
              href={product.href}
              className="group overflow-hidden border border-border bg-background"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={`${product.brand} ${product.name}`}
                className="aspect-square w-full bg-muted object-contain p-4 mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.03] dark:mix-blend-normal"
              />
              <div className="space-y-1 px-3 pb-3">
                <p className="truncate text-[11px] font-semibold text-foreground">
                  {product.brand}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">{product.name}</p>
                <p className="text-[12px] font-semibold tabular-nums text-foreground">
                  {formatPrice(product.price)}원
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
