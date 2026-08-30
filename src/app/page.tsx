import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryQuickBar } from "@/components/home/CategoryQuickBar";
import { TopBrandSection } from "@/components/home/TopBrandSection";
import { TimeSaleSection } from "@/components/home/TimeSaleSection";
import { RankingSection } from "@/components/home/RankingSection";
import { AudiencePickSection } from "@/components/home/AudiencePickSection";
import { PriceBandSection } from "@/components/home/PriceBandSection";
import { TrendPickSection } from "@/components/home/TrendPickSection";
import { TrustEvidenceSection } from "@/components/home/TrustEvidenceSection";
import { SellTradeCTA } from "@/components/home/SellTradeCTA";
import { HomeFaqSection } from "@/components/home/HomeFaqSection";
import { PurchaseReviewGallery } from "@/components/reviews/PurchaseReviewGallery";
import { getHomePageData } from "@/lib/catalog";
import { getPublishedHeroSlides } from "@/lib/hero-slides-server";

export const revalidate = 15;

export default async function HomePage() {
  const [{
    categoryItems,
    timeSaleProducts,
    timeSaleEndsAt,
    rankedProducts,
    rankedTabs,
    audienceTabs,
    priceBandTabs,
    trendStories,
  }, heroSlides] = await Promise.all([getHomePageData(), getPublishedHeroSlides()]);

  return (
    <>
      <HeroCarousel slides={heroSlides} />
      <CategoryQuickBar items={categoryItems} />
      <TopBrandSection />
      <TimeSaleSection products={timeSaleProducts} endsAt={timeSaleEndsAt} />
      <RankingSection rankedProducts={rankedProducts} rankedTabs={rankedTabs} />
      <AudiencePickSection
        title="지금 누구를 위한 명품을 찾고 계세요?"
        description="상황에 맞는 명품을 골라드릴게요."
        tabs={audienceTabs}
        moreHref="/search"
      />
      <PriceBandSection tabs={priceBandTabs} moreHref="/products" />
      <TrendPickSection stories={trendStories} />
      <TrustEvidenceSection />
      <PurchaseReviewGallery />
      <SellTradeCTA />
      <HomeFaqSection />
    </>
  );
}
