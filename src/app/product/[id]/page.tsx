import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  MessageCircle,
  Package,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import {
  AuthenticationBadge,
  ConditionBadge,
} from "@/components/product/ProductBadge";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFaq } from "@/components/product/ProductFaq";
import { ProductInquiryChat } from "@/components/product/ProductInquiryChat";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductPurchaseBar } from "@/components/product/ProductPurchaseBar";
import { ProductCheckoutActions } from "@/components/product/ProductCheckoutActions";
import { RecentlyViewedTracker } from "@/components/account/RecentlyViewedTracker";
import { getCatalogProductById, getCatalogProducts } from "@/lib/catalog";
import { AUTHENTICITY_GUARANTEE } from "@/lib/guarantee";
import { getPlaceholderGradient, isRealImage } from "@/lib/placeholder";
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
      <div className="container py-6 md:py-10">
        <nav className="flex items-center gap-1.5 border-b border-border pb-4 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            홈
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/brand" className="transition-colors hover:text-foreground">
            브랜드
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">{product.brand}</span>
        </nav>

        <section className="grid gap-10 border-b border-border py-8 lg:grid-cols-[minmax(0,58%)_minmax(380px,1fr)] lg:gap-14">
          <div className="grid gap-4 md:grid-cols-[76px_minmax(0,1fr)]">
            <div className="hidden space-y-3 md:block">
              {galleryImages.slice(0, 4).map(
                (imageUrl, index) => (
                  <div
                    key={`${imageUrl}-${index}`}
                    className="aspect-square border border-border bg-[#f8f8f8] p-1.5"
                  >
                    <div
                      className="h-full bg-[#f3f3f3]"
                      style={
                        isRealImage(imageUrl)
                          ? undefined
                          : { backgroundImage: getPlaceholderGradient(`${product.id}-${index}`) }
                      }
                    >
                      {isRealImage(imageUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={`${product.brand} ${product.name}`}
                          className="h-full w-full object-contain p-1 mix-blend-multiply"
                        />
                      ) : null}
                    </div>
                  </div>
                )
              )}
            </div>

            <div>
              <div className="relative aspect-square border border-border bg-[#f8f8f8]">
                <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-1.5">
                  <AuthenticationBadge status={product.authenticationStatus} />
                  {product.isPreOwned && product.condition ? (
                    <ConditionBadge condition={product.condition} />
                  ) : null}
                </div>
                {isRealImage(galleryImages[0]) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={galleryImages[0]}
                    alt={`${product.brand} ${product.name}`}
                    className="h-full w-full object-contain p-10 mix-blend-multiply md:p-16"
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{ backgroundImage: getPlaceholderGradient(product.id) }}
                  />
                )}
              </div>

              <div className="mt-5 grid grid-cols-3 border border-border text-center text-sm">
                <TrustCell icon={ShieldCheck} title="정품 검수" description="출고 전 확인" />
                <TrustCell icon={Truck} title={product.deliveryBadge} description={deliveryCopy} />
                <TrustCell icon={Package} title="구성품" description={packageItems.join(" / ")} />
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border-b border-border pb-5">
              <Link
                href={`/search?q=${encodeURIComponent(product.brand)}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {product.brand}
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>

              <h1 className="mt-3 text-xl font-medium leading-8 tracking-tight text-foreground md:text-2xl">
                {product.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 text-foreground">
                  <Star className="size-4 fill-gold text-gold" />
                  <span className="font-semibold">{reviewSummary.averageLabel}</span>
                </span>
                <Link href="#reviews" className="text-muted-foreground underline-offset-4 hover:underline">
                  리뷰 {reviewSummary.count}개
                </Link>
                <span className="text-muted-foreground">상품번호 {product.id.toUpperCase()}</span>
              </div>
            </div>

            <div className="border-b border-border py-5">
              <PriceDisplay
                price={product.price}
                retailPrice={product.retailPrice}
                discountRate={product.discountRate}
                size="lg"
              />
              <dl className="mt-4 divide-y divide-border text-sm">
                <InfoLine label="카드혜택" value="무이자 할부 및 카드사 혜택 적용 가능" />
                <InfoLine label="배송정보" value={deliveryCopy} />
                <InfoLine label="관부가세" value="상품가 포함, 추가 비용 없음" />
                <InfoLine label="정품보장" value={AUTHENTICITY_GUARANTEE} />
              </dl>
            </div>

            <div className="border-b border-border py-5">
              {options.sizes.length > 0 ? (
                <OptionBlock title={options.sizeLabel}>
                  <div className="grid gap-2">
                    {options.sizes.map((size) => (
                      <div
                        key={size.label}
                        className="flex min-h-12 items-center justify-between border border-foreground bg-secondary px-4 text-left text-sm"
                      >
                        <span className="font-semibold text-foreground">{size.label}</span>
                        {size.detail ? (
                          <span className="text-xs text-muted-foreground">{size.detail}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </OptionBlock>
              ) : null}

              {options.colors.length > 0 ? (
                <OptionBlock title="색상">
                  <div className="grid grid-cols-2 gap-2">
                    {options.colors.map((color) => (
                      <div
                        key={color.label}
                        className="min-h-11 border border-foreground bg-secondary px-3 text-left text-sm font-semibold leading-[2.75rem] text-foreground"
                      >
                        {color.label}
                      </div>
                    ))}
                  </div>
                </OptionBlock>
              ) : null}
            </div>

            <div className="border-b border-border py-5">
              <p className="text-sm font-semibold text-foreground">구성</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {packageItems.join(" / ")}
              </p>
            </div>

            <ProductCheckoutActions product={product} />
            <ProductInquiryChat product={product} />
          </aside>
        </section>

        <nav className="sticky top-[113px] z-20 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur">
          <div className="container flex h-14 gap-8 overflow-x-auto px-0 text-sm font-semibold no-scrollbar">
            {[
              ["#detail", "상품정보"],
              ["#delivery", "배송/반품"],
              ["#reviews", "리뷰"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="flex shrink-0 items-center border-b-2 border-transparent text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <section id="detail" className="grid gap-10 border-b border-border py-10 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div>
            <h2 className="text-xl font-semibold text-foreground">상품정보</h2>
            <p className="mt-2 text-sm text-muted-foreground">구매 전 필수 확인 정보</p>
          </div>
          <div>
            <section className="border-b border-border pb-8">
              <h3 className="text-lg font-semibold text-foreground">
                {product.brand} {product.name}
              </h3>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                {product.detailContent ? (
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground"
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
            </section>

            <section className="border-b border-border py-8">
              <h3 className="text-lg font-semibold text-foreground">상품 상세</h3>
              <dl className="mt-5 divide-y divide-border border-y border-border">
                {detailRows.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[120px_minmax(0,1fr)] py-3 text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {options.sizeGuide.length > 0 ? (
              <section className="py-8">
                <h3 className="text-lg font-semibold text-foreground">사이즈 안내</h3>
                <div className="mt-5 divide-y divide-border border-y border-border">
                  {options.sizeGuide.map((size) => (
                    <div key={size.label} className="grid grid-cols-[120px_minmax(0,1fr)] py-3 text-sm">
                      <dt className="font-semibold text-foreground">{size.label}</dt>
                      <dd className="text-muted-foreground">{size.detail ?? "해당 상품 사이즈"}</dd>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </section>

        <section id="delivery" className="grid gap-10 border-b border-border py-10 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div>
            <h2 className="text-xl font-semibold text-foreground">배송/반품</h2>
            <p className="mt-2 text-sm text-muted-foreground">정책 및 보상 안내</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <PolicyCard title="배송" description={deliveryCopy} icon={Truck} />
            <PolicyCard
              title="정품 보장"
              description={AUTHENTICITY_GUARANTEE}
              icon={ShieldCheck}
            />
            <PolicyCard
              title="문의"
              description="상품 옵션과 구성품은 구매 전 문의 가능"
              icon={MessageCircle}
            />
          </div>
        </section>

        <section className="border-b border-border py-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">함께 보면 좋은 상품</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                같은 브랜드와 인기 상품을 함께 확인해 보세요.
              </p>
            </div>
            <Link
              href="/new-arrivals"
              className="hidden items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              더보기
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {recommendedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>

        <section id="reviews" className="border-b border-border py-10">
          <ProductReviews initialReviews={defaultProductReviews} />
        </section>

        <section id="faq" className="py-10">
          <ProductFaq />
        </section>

        <ProductPurchaseBar product={product} />
      </div>
    </div>
  );
}

function TrustCell({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="border-r border-border p-4 last:border-r-0">
      <Icon className="mx-auto size-5 text-gold" strokeWidth={1.8} />
      <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function OptionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
      {children}
    </div>
  );
}

function PolicyCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Truck;
  title: string;
  description: string;
}) {
  return (
    <div className="border border-border p-5">
      <Icon className="size-5 text-gold" strokeWidth={1.8} />
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
