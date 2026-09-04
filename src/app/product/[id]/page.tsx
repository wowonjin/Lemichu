import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { KakaoCsLink } from "@/components/account/KakaoCsLink";
import { KoboyoIcon, type KoboyoIconName } from "@/components/icons/KoboyoIcon";
import { ProductBuyNotice } from "@/components/product/ProductBuyNotice";
import { ProductFaq } from "@/components/product/ProductFaq";
import { RelatedProductRail } from "@/components/product/RelatedProductRail";
import { PurchaseReviewGallery } from "@/components/reviews/PurchaseReviewGallery";
import { ProductPurchaseBar } from "@/components/product/ProductPurchaseBar";
import { ProductCheckoutActions } from "@/components/product/ProductCheckoutActions";
import { ProductPointsRedeem } from "@/components/product/ProductPointsRedeem";
import {
  ProductVariantPrice,
  ProductVariantPurchaseProvider,
} from "@/components/product/ProductVariantPurchase";
import { RecentlyViewedTracker } from "@/components/account/RecentlyViewedTracker";
import { ProductAdminEditor } from "@/components/product/ProductAdminEditor";
import { KakaoChannelBanner } from "@/components/product/KakaoChannelBanner";
import { ProductDetailImageStack } from "@/components/product/ProductDetailImageStack";
import { ProductDetailInfo } from "@/components/product/ProductDetailInfo";
import { ProductDetailSectionNav } from "@/components/product/ProductDetailSectionNav";
import { ProductPurchaseInfo } from "@/components/product/ProductPurchaseInfo";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductShareButton } from "@/components/product/ProductShareButton";
import { WishlistToggleButton } from "@/components/product/WishlistToggleButton";
import { getCatalogProductById, getCatalogProducts } from "@/lib/catalog";
import { BANK_TRANSFER_ACCOUNT } from "@/lib/bank-transfer";
import {
  buildProductInquiryMessage,
  getPublicProductUrl,
  getPublicSiteUrl,
  toAbsolutePublicUrl,
} from "@/lib/kakao-inquiry";
import { SITE_NAME, productDocumentTitle, siteTitle } from "@/lib/site";
import { AUTHENTICITY_GUARANTEE } from "@/lib/guarantee";
import { formatProductOptions } from "@/lib/productOptions";
import { SOLD_OUT_NOTICE, isSoldProduct } from "@/components/product/SoldOutOverlay";
import { getProductKind } from "@/lib/productKind";
import type { Product } from "@/types/product";

type Params = Promise<{ id: string }>;

const DOMESTIC_DELIVERY_COPY = [
  "오후 14:00 시 이전 결제 완료 시, 당일 출고",
  "평균 1~3일 이내 수령",
] as const;

function getRecommendedProducts(products: Product[], product: Product) {
  const available = products.filter(
    (item) => item.id !== product.id && !isSoldProduct(item)
  );
  const kind = getProductKind(product);
  const sameBrand = (item: Product) => item.brand === product.brand;
  const sameKind = (item: Product) => getProductKind(item) === kind;

  const brandAndKind = available.filter((item) => sameBrand(item) && sameKind(item));
  const kindOnly = available.filter((item) => !sameBrand(item) && sameKind(item));
  const brandOnly = available.filter((item) => sameBrand(item) && !sameKind(item));
  const others = available.filter((item) => !sameBrand(item) && !sameKind(item));

  return [...brandAndKind, ...kindOnly, ...brandOnly, ...others].slice(0, 15);
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
  const recommendedProducts = getRecommendedProducts(catalogProducts, product);
  const options = formatProductOptions(product);
  const galleryImages = product.imageUrls?.length ? product.imageUrls : [product.imageUrl];
  const sold = isSoldProduct(product);

  return (
    <div className="min-w-0 overflow-x-clip bg-background pb-[calc(7rem+var(--mobile-bottom-nav-offset))] md:pb-0">
      <RecentlyViewedTracker productId={product.id} />
      <ProductAdminEditor product={product} />
      <div className="container min-w-0 py-4 md:py-10">
        <nav className="flex min-w-0 flex-wrap items-center gap-1.5 text-[13px] text-[#8B8B8B] dark:text-muted-foreground">
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
        <section className="grid min-w-0 gap-10 py-6 md:py-8 lg:grid-cols-[minmax(0,58%)_minmax(380px,1fr)] lg:items-start lg:gap-14">
          <div
            id="product-images"
            className="min-w-0 max-w-full scroll-mt-[calc(var(--header-height)+1rem)]"
          >
            <ProductImageGallery product={product} images={galleryImages} />
          </div>

          <div className="min-w-0 max-w-full lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:row-span-2 lg:self-start">
            <aside className="min-w-0">
              <div>
                <Link
                  href={`/search?q=${encodeURIComponent(product.brand)}`}
                  className="group inline-flex items-center gap-0.5 text-[15px] font-bold tracking-tight text-foreground"
                >
                  {product.brand}
                  <ChevronRight className="size-4 text-[#B0B0B0] transition-transform group-hover:translate-x-0.5" />
                </Link>

                <div className="mt-2.5 flex items-start justify-between gap-3">
                  <h1 className="min-w-0 text-[20px] font-semibold leading-[1.4] tracking-tight text-foreground md:text-[22px]">
                    {product.name}
                  </h1>
                  <div className="-mr-1.5 flex shrink-0 items-center">
                    <WishlistToggleButton
                      product={product}
                      appearance="boxed"
                      className="size-9 border-0 hover:border-transparent"
                      iconClassName="size-[18px]"
                    />
                    <ProductShareButton
                      productId={product.id}
                      productName={`${product.brand} ${product.name}`}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <ProductVariantPrice />
                </div>

                {sold ? (
                  <div className="mt-4 rounded-md bg-[#F7F7F7] px-4 py-3.5 dark:bg-muted">
                    <p className="text-[14px] font-semibold leading-6 text-foreground">
                      {SOLD_OUT_NOTICE}
                    </p>
                    <a
                      href="#similar-products"
                      className="mt-2 inline-flex text-[13px] font-semibold text-foreground underline-offset-4 hover:underline"
                    >
                      비슷한 상품 보기
                    </a>
                  </div>
                ) : null}
              </div>

              <div className="bg-background pt-4 pb-5">
                <ProductPointsRedeem />
                {sold ? null : <KakaoChannelBanner />}
                {sold ? null : (
                  <dl className="mt-4 text-[13px]">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[#8B8B8B] dark:text-muted-foreground">배송비</dt>
                      <dd className="font-medium text-foreground">무료</dd>
                    </div>
                  </dl>
                )}
                <ProductPurchaseInfo
                  rows={[
                    ["결제방법", BANK_TRANSFER_ACCOUNT.methodLabel],
                    ["배송정보", "무료배송 / 국내배송 / 평균 1~3일 이내 도착"],
                    ["정품보장", AUTHENTICITY_GUARANTEE],
                  ]}
                />
              </div>

              <ProductCheckoutActions product={product} />
            </aside>
          </div>

          <div className="min-w-0">
            <ProductDetailSectionNav />

            <section
              id="detail"
              className="scroll-mt-[calc(var(--header-height)+3.5rem)] py-10 md:py-12"
            >
              <div>
                <h2 className="text-xl font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
                  상품정보
                </h2>
                <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
                  구매 전 꼭 확인해야 할 정보를 모았어요.
                </p>
              </div>

              <ProductDetailInfo product={product} sizeGuide={options.sizeGuide} />
              <ProductDetailImageStack
                images={galleryImages}
                alt={`${product.brand} ${product.name}`}
              />
            </section>

            <ProductBuyNotice />

            <section
              id="delivery"
              className="scroll-mt-[calc(var(--header-height)+3.5rem)] pb-10 md:pb-12"
            >
              <div>
                <h2 className="text-xl font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
                  배송/반품
                </h2>
                <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
                  배송 일정과 보상 정책을 구매 전에 확인하세요.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mt-8 md:gap-4 lg:grid-cols-3">
                <PolicyCard
                  title="국내배송"
                  description={
                    <>
                      {DOMESTIC_DELIVERY_COPY.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </>
                  }
                  icon="truck"
                />
                <PolicyCard
                  title="정품 보장"
                  description={AUTHENTICITY_GUARANTEE}
                  icon="shield-check"
                />
                <PolicyCard
                  title="문의"
                  description="상품 상태·구성품·사이즈 등 궁금한 점을 문의해 주세요."
                  icon="speech-bubble"
                  action={
                    <KakaoCsLink
                      className="mt-3 inline-flex items-center text-[13px] font-semibold text-foreground transition-colors hover:text-foreground/70"
                      message={buildProductInquiryMessage({
                        productId: product.id,
                        brand: product.brand,
                        name: product.name,
                        color: product.color,
                        size: product.size,
                      })}
                    >
                      1:1 문의하기 →
                    </KakaoCsLink>
                  }
                />
              </div>
            </section>

            <div className="scroll-mt-[calc(var(--header-height)+3.5rem)]">
              <PurchaseReviewGallery className="scroll-mt-[calc(var(--header-height)+3.5rem)] overflow-hidden rounded-2xl" />
            </div>

            <section
              id="faq"
              className="scroll-mt-[calc(var(--header-height)+3.5rem)] pb-4 pt-10 md:pt-14"
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
  action,
}: {
  icon: KoboyoIconName;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-md bg-[#F7F7F7] px-4 py-5 dark:bg-muted sm:px-6 sm:py-6 md:px-7 md:py-7">
      <KoboyoIcon name={icon} className="block size-7 text-foreground" />
      <h3 className="mt-4 text-[17px] font-bold tracking-tight text-foreground md:text-[18px]">
        {title}
      </h3>
      <div className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
        {description}
      </div>
      {action}
    </div>
  );
}
