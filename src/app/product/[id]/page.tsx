import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { KoboyoIcon, type KoboyoIconName } from "@/components/icons/KoboyoIcon";
import { ProductFaq } from "@/components/product/ProductFaq";
import { RelatedProductRail } from "@/components/product/RelatedProductRail";
import { ProductReviewHeaderStats } from "@/components/product/ProductReviewHeaderStats";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductPurchaseBar } from "@/components/product/ProductPurchaseBar";
import { ProductCheckoutActions } from "@/components/product/ProductCheckoutActions";
import { ProductPointsRedeem } from "@/components/product/ProductPointsRedeem";
import {
  ProductVariantPrice,
  ProductVariantPurchaseProvider,
  ProductVariantSelector,
} from "@/components/product/ProductVariantPurchase";
import { RecentlyViewedTracker } from "@/components/account/RecentlyViewedTracker";
import { ProductAdminEditor } from "@/components/product/ProductAdminEditor";
import { ProductDetailInfo } from "@/components/product/ProductDetailInfo";
import { ProductPurchaseInfo } from "@/components/product/ProductPurchaseInfo";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { getCatalogProductById, getCatalogProducts } from "@/lib/catalog";
import { BANK_TRANSFER_ACCOUNT } from "@/lib/bank-transfer";
import { getPublicProductUrl, getPublicSiteUrl, toAbsolutePublicUrl } from "@/lib/kakao-inquiry";
import { SITE_NAME, productDocumentTitle, siteTitle } from "@/lib/site";
import { AUTHENTICITY_GUARANTEE } from "@/lib/guarantee";
import { formatProductOptions } from "@/lib/productOptions";
import { getReviewSummary } from "@/data/productReviews";
import { listPublishedProductReviews } from "@/lib/reviews-admin";
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

  return [...sameBrand, ...others].slice(0, 15);
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getCatalogProductById(id);
  const pageTitle = product
    ? productDocumentTitle(product.brand, product.name)
    : "상품";
  const description = product
    ? `${pageTitle} 정품 검수 명품. 상품번호 ${product.id.toUpperCase()}`
    : "정품 검수 완료 명품을 확인하세요.";
  const productUrl = getPublicProductUrl(id);
  const images = product?.imageUrl
    ? [{ url: toAbsolutePublicUrl(product.imageUrl), alt: pageTitle }]
    : undefined;

  return {
    metadataBase: new URL(getPublicSiteUrl()),
    title: pageTitle,
    description,
    alternates: { canonical: productUrl },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: SITE_NAME,
      title: siteTitle(pageTitle),
      description,
      url: productUrl,
      images,
    },
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
  const productReviews = await listPublishedProductReviews(product.id);
  const reviewSummary = getReviewSummary(productReviews);
  const galleryImages = product.imageUrls?.length ? product.imageUrls : [product.imageUrl];
  const packageItems = product.isPreOwned
    ? ["본품", "검수 카드", "안심 포장"]
    : ["본품", "더스트백", "쇼핑백", "인보이스 사본"];

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

        <ProductVariantPurchaseProvider key={product.id} product={product}>
        <section className="grid gap-10 py-6 md:py-8 lg:grid-cols-[minmax(0,58%)_minmax(380px,1fr)] lg:items-start lg:gap-14">
          <div
            id="product-images"
            className="scroll-mt-[calc(var(--header-height)+1rem)]"
          >
            <ProductImageGallery product={product} images={galleryImages} />
          </div>

          <div className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:row-span-2 lg:self-start">
            <aside>
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

                <div className="mt-3 text-[13px]">
                  <ProductReviewHeaderStats
                    productId={product.id}
                    initialSummary={reviewSummary}
                  />
                </div>
              </div>

              <div className="rounded-md bg-[#F7F7F7] px-5 py-5 dark:bg-muted md:px-6 md:py-6">
                <ProductVariantPrice />
                <ProductPointsRedeem />
                <div className="mt-5 border-t border-[#E8E8E8] pt-5 dark:border-border">
                  <ProductVariantSelector />
                </div>
                <ProductPurchaseInfo
                  rows={[
                    [
                      "결제방법",
                      `${BANK_TRANSFER_ACCOUNT.methodLabel} · ${BANK_TRANSFER_ACCOUNT.bankName} ${BANK_TRANSFER_ACCOUNT.accountHolder}`,
                    ],
                    ["배송정보", deliveryCopy],
                    ["관부가세", "상품가 포함, 추가 비용 없음"],
                    ["정품보장", AUTHENTICITY_GUARANTEE],
                    ["구성", packageItems.join(" / ")],
                  ]}
                />
              </div>

              <ProductCheckoutActions product={product} />
            </aside>
          </div>

          <div className="min-w-0">
            <nav className="sticky top-[var(--header-height)] z-30 -mx-4 border-b border-[#EEEEEE] bg-background px-4 dark:border-border lg:mx-0 lg:px-0">
              <div className="flex h-14 gap-7 overflow-x-auto text-[14px] font-semibold no-scrollbar">
                {[
                  ["#product-images", "상품 이미지"],
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

            <section
              id="detail"
              className="scroll-mt-[calc(var(--header-height)+3.5rem)] py-10 md:py-12"
            >
              <div>
                <h2 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
                  상품정보
                </h2>
                <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
                  구매 전 꼭 확인해야 할 정보를 모았어요.
                </p>
              </div>

              <ProductDetailInfo product={product} sizeGuide={options.sizeGuide} />
            </section>

            <section
              id="delivery"
              className="scroll-mt-[calc(var(--header-height)+3.5rem)] pb-10 md:pb-12"
            >
              <div>
                <h2 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
                  배송/반품
                </h2>
                <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
                  배송 일정과 보상 정책을 구매 전에 확인하세요.
                </p>
              </div>
              <div className="mt-7 grid grid-cols-3 gap-3 md:mt-8 md:gap-4">
                <PolicyCard title="배송" description={deliveryCopy} icon="truck" />
                <PolicyCard
                  title="정품 보장"
                  description={AUTHENTICITY_GUARANTEE}
                  icon="shield-check"
                />
                <PolicyCard
                  title="문의"
                  description="상품 옵션과 구성품은 구매 전 문의 가능"
                  icon="speech-bubble"
                />
              </div>
            </section>

            <section
              id="reviews"
              className="scroll-mt-[calc(var(--header-height)+3.5rem)] pb-10 md:pb-12"
            >
              <ProductReviews productId={product.id} initialReviews={productReviews} />
            </section>

            <section
              id="faq"
              className="scroll-mt-[calc(var(--header-height)+3.5rem)] pb-4"
            >
              <ProductFaq />
            </section>
          </div>
        </section>
        <ProductPurchaseBar product={product} />
        </ProductVariantPurchaseProvider>

        <RelatedProductRail products={recommendedProducts} />

      </div>
    </div>
  );
}

function PolicyCard({
  icon,
  title,
  description,
}: {
  icon: KoboyoIconName;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col rounded-md bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7">
      <KoboyoIcon name={icon} className="block size-7 text-foreground" />
      <h3 className="mt-4 text-[17px] font-bold tracking-tight text-foreground md:text-[18px]">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
