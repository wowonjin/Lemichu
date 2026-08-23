import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFaq } from "@/components/product/ProductFaq";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductPurchaseBar } from "@/components/product/ProductPurchaseBar";
import { ProductCheckoutActions } from "@/components/product/ProductCheckoutActions";
import {
  ProductVariantPrice,
  ProductVariantPurchaseProvider,
  ProductVariantSelector,
} from "@/components/product/ProductVariantPurchase";
import { RecentlyViewedTracker } from "@/components/account/RecentlyViewedTracker";
import { ProductAdminEditor } from "@/components/product/ProductAdminEditor";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { getCatalogProductById, getCatalogProducts } from "@/lib/catalog";
import { AUTHENTICITY_GUARANTEE } from "@/lib/guarantee";
import { formatProductOptions } from "@/lib/productOptions";
import { defaultProductReviews, getReviewSummary } from "@/data/productReviews";
import type { Product } from "@/types/product";

type Params = Promise<{ id: string }>;

function getDeliveryCopy(deliveryBadge: string) {
  if (deliveryBadge === "오늘출고") return "오늘 결제 시 검수센터에서 빠른 출고";
  if (deliveryBadge === "국내배송") return "국내 보유 재고로 평균 2-4일 내 도착";
  if (deliveryBadge === "예약배송") return "입고 일정 확인 후 순차 배송";
  return "해외 현지 구매 후 평균 8-15일 내 도착";
}

function getRecommendedProducts(products: Product[], productId: string, brand: string) {
  const sameBrand = products.filter(
    (item) => item.id !== productId && item.brand === brand
  );
  const others = products.filter(
    (item) => item.id !== productId && item.brand !== brand
  );

  return [...sameBrand, ...others].slice(0, 5);
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getCatalogProductById(id);
  return {
    title: product
      ? `${product.brand} ${product.name} — LEMICHU`
      : "상품 — LEMICHU",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const product = await getCatalogProductById(id);

  if (!product) {
    notFound();
  }

  const catalogProducts = await getCatalogProducts();
  const recommendedProducts = getRecommendedProducts(catalogProducts, product.id, product.brand);
  const deliveryCopy = getDeliveryCopy(product.deliveryBadge);
  const options = formatProductOptions(product);
  const reviewSummary = getReviewSummary(defaultProductReviews);
  const galleryImages = product.imageUrls?.length ? product.imageUrls : [product.imageUrl];
  const packageItems = product.isPreOwned
    ? ["본품", "검수 카드", "안심 포장"]
    : ["본품", "더스트백", "쇼핑백", "인보이스 사본"];
  const detailRows = [
    ["브랜드", product.brand],
    ["상품번호", product.id.toUpperCase()],
    ["상품 구분", product.isPreOwned ? "중고명품" : "신상품"],
    ["상태 등급", product.condition ?? "새상품"],
    ["색상", product.color ?? "상세 옵션 확인"],
    ["사이즈", product.size ?? "단일 사이즈"],
    ["배송", product.deliveryBadge],
    ["관부가세", "상품가 포함"],
  ];

  return (
    <div className="bg-background pb-28">
      <RecentlyViewedTracker productId={product.id} />
      <ProductAdminEditor product={product} />
      <div className="container py-6 md:py-10">
        <nav className="flex items-center gap-1.5 text-[13px] text-[#8B8B8B] dark:text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            홈
          </Link>
          <ChevronRight className="size-3.5 text-[#D0D0D0]" />
          <Link href="/brand" className="transition-colors hover:text-foreground">
            브랜드
          </Link>
          <ChevronRight className="size-3.5 text-[#D0D0D0]" />
          <span className="font-medium text-foreground">{product.brand}</span>
        </nav>

        <section className="grid gap-10 py-6 md:py-8 lg:grid-cols-[minmax(0,58%)_minmax(380px,1fr)] lg:gap-14">
          <ProductImageGallery product={product} images={galleryImages} />

          <ProductVariantPurchaseProvider product={product}>
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="pb-5">
              <Link
                href={`/search?q=${encodeURIComponent(product.brand)}`}
                className="group inline-flex items-center gap-0.5 text-[15px] font-bold tracking-tight text-foreground"
              >
                {product.brand}
                <ChevronRight className="size-4 text-[#B0B0B0] transition-transform group-hover:translate-x-0.5" />
              </Link>

              <h1 className="mt-2.5 text-[20px] font-semibold leading-[1.4] tracking-tight text-foreground md:text-[22px]">
                {product.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
                <span className="inline-flex items-center gap-1 text-foreground">
                  <Star className="size-3.5 fill-gold text-gold" />
                  <span className="font-semibold">{reviewSummary.averageLabel}</span>
                </span>
                <Link
                  href="#reviews"
                  className="text-[#8B8B8B] underline-offset-4 transition-colors hover:text-foreground hover:underline dark:text-muted-foreground"
                >
                  리뷰 {reviewSummary.count}개
                </Link>
                <span className="text-[#B0B0B0] dark:text-muted-foreground">
                  상품번호 {product.id.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="rounded-[20px] bg-[#F7F7F7] px-6 py-6 dark:bg-muted">
              <ProductVariantPrice />
              <dl className="mt-5 space-y-3 border-t border-[#E8E8E8] pt-5 text-[13px] dark:border-border">
                <InfoLine label="카드혜택" value="무이자 할부 및 카드사 혜택 적용 가능" />
                <InfoLine label="배송정보" value={deliveryCopy} />
                <InfoLine label="관부가세" value="상품가 포함, 추가 비용 없음" />
                <InfoLine label="정품보장" value={AUTHENTICITY_GUARANTEE} />
                <InfoLine label="구성" value={packageItems.join(" / ")} />
              </dl>
            </div>

            <ProductVariantSelector />

            <ProductCheckoutActions product={product} />
          </aside>
          <ProductPurchaseBar product={product} />
          </ProductVariantPurchaseProvider>
        </section>

        <nav className="sticky top-[113px] z-20 -mx-4 border-b border-[#EEEEEE] bg-background/95 px-4 backdrop-blur dark:border-border">
          <div className="container flex h-14 gap-7 overflow-x-auto px-0 text-[14px] font-semibold no-scrollbar">
            {[
              ["#detail", "상품정보"],
              ["#delivery", "배송/반품"],
              ["#reviews", "리뷰"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="flex shrink-0 items-center border-b-2 border-transparent text-[#8B8B8B] transition-colors hover:border-foreground hover:text-foreground dark:text-muted-foreground"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <section id="detail" className="scroll-mt-40 py-12 md:py-16">
          <div className="max-w-[640px]">
            <h2 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
              상품정보
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
              구매 전 꼭 확인해야 할 정보를 모았어요.
            </p>
          </div>

          <div className="mt-7 grid gap-3 md:mt-8 lg:grid-cols-2 lg:gap-4">
            <div className="rounded-[20px] bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7">
              <h3 className="text-[16px] font-bold tracking-tight text-foreground md:text-[17px]">
                {product.brand} {product.name}
              </h3>
              <div className="mt-4 space-y-3 text-[14px] leading-6 text-[#6B6B6B] dark:text-muted-foreground">
                {product.detailContent ? (
                  <div
                    className="prose prose-sm max-w-none text-[#6B6B6B] dark:text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: product.detailContent }}
                  />
                ) : (
                  <>
                    <p>
                      {product.isPreOwned
                        ? `${product.condition ?? "A"} 등급으로 검수 완료된 중고명품입니다.`
                        : "정식 유통처를 통해 입고된 신상품입니다."}{" "}
                      주문 전 색상, 사이즈, 구성품을 확인해 주세요.
                    </p>
                    <p>
                      모든 상품은 출고 전 정품 검수와 포장 상태 확인을 거치며,
                      관세 및 부가세가 포함된 가격으로 판매됩니다.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-[20px] bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7">
              <h3 className="text-[16px] font-bold tracking-tight text-foreground md:text-[17px]">
                상품 상세
              </h3>
              <dl className="mt-4 divide-y divide-[#EBEBEB] dark:divide-border">
                {detailRows.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[110px_minmax(0,1fr)] py-2.5 text-[13px]">
                    <dt className="text-[#8B8B8B] dark:text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {options.sizeGuide.length > 0 ? (
            <div className="mt-3 rounded-[20px] bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:mt-4 md:px-7 md:py-7">
              <h3 className="text-[16px] font-bold tracking-tight text-foreground md:text-[17px]">
                사이즈 안내
              </h3>
              <div className="mt-4 divide-y divide-[#EBEBEB] dark:divide-border">
                {options.sizeGuide.map((size) => (
                  <div key={size.label} className="grid grid-cols-[110px_minmax(0,1fr)] py-2.5 text-[13px]">
                    <dt className="font-semibold text-foreground">{size.label}</dt>
                    <dd className="text-[#8B8B8B] dark:text-muted-foreground">
                      {size.detail ?? "해당 상품 사이즈"}
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section id="delivery" className="scroll-mt-40 pb-12 md:pb-16">
          <div className="max-w-[640px]">
            <h2 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
              배송/반품
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
              배송 일정과 보상 정책을 구매 전에 확인하세요.
            </p>
          </div>
          <div className="mt-7 grid gap-3 md:mt-8 md:grid-cols-3 md:gap-4">
            <PolicyCard id="01" title="배송" description={deliveryCopy} icon={Truck} />
            <PolicyCard
              id="02"
              title="정품 보장"
              description={AUTHENTICITY_GUARANTEE}
              icon={ShieldCheck}
            />
            <PolicyCard
              id="03"
              title="문의"
              description="상품 옵션과 구성품은 구매 전 문의 가능"
              icon={MessageCircle}
            />
          </div>
        </section>

        <section className="pb-12 md:pb-16">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
                함께 보면 좋은 상품
              </h2>
              <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
                같은 브랜드와 인기 상품을 함께 확인해 보세요.
              </p>
            </div>
            <Link
              href="/new-arrivals"
              className="group hidden shrink-0 items-center gap-0.5 text-[13px] font-medium text-[#8B8B8B] transition-colors hover:text-foreground dark:text-muted-foreground md:inline-flex md:text-[14px]"
            >
              더보기
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 md:mt-8 lg:grid-cols-5">
            {recommendedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>

        <section id="reviews" className="scroll-mt-40 pb-12 md:pb-16">
          <ProductReviews initialReviews={defaultProductReviews} />
        </section>

        <section id="faq" className="scroll-mt-40">
          <ProductFaq />
        </section>

      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3">
      <dt className="text-[#8B8B8B] dark:text-muted-foreground">{label}</dt>
      <dd className="font-medium leading-5 text-foreground">{value}</dd>
    </div>
  );
}

function PolicyCard({
  id,
  icon: Icon,
  title,
  description,
}: {
  id: string;
  icon: typeof Truck;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col rounded-[20px] bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:min-h-[180px] md:px-7 md:py-7">
      <div className="flex items-start justify-between gap-4">
        <Icon className="size-5 text-foreground" strokeWidth={1.5} aria-hidden />
        <span className="text-[12px] font-bold tabular-nums tracking-tight text-[#B0B0B0] dark:text-muted-foreground">
          {id}
        </span>
      </div>
      <h3 className="mt-5 text-[17px] font-bold tracking-tight text-foreground md:text-[18px]">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
