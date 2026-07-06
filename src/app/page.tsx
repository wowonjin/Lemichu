import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryQuickBar } from "@/components/home/CategoryQuickBar";
import { TimeSaleSection } from "@/components/home/TimeSaleSection";
import { ProductRail } from "@/components/home/ProductRail";
import { RankingSection } from "@/components/home/RankingSection";
import { SellTradeCTA } from "@/components/home/SellTradeCTA";
import { AuthenticationGuide } from "@/components/home/AuthenticationGuide";
import { getHomeProductSets, getRankedProducts } from "@/lib/catalog";

export default async function HomePage() {
  const [{ todaysDeals, preOwnedVerified, readyToShip, priceDrops }, rankedProducts] =
    await Promise.all([getHomeProductSets(), getRankedProducts(18)]);

  return (
    <>
      <HeroCarousel />
      <CategoryQuickBar />
      <TimeSaleSection products={priceDrops.length > 0 ? priceDrops : todaysDeals} />

      <ProductRail
        title="오늘의 럭셔리 딜"
        products={todaysDeals}
        moreHref="/promotions"
      />

      <ProductRail
        title="방금 검수 완료된 중고명품"
        products={preOwnedVerified}
        moreHref="/pre-owned"
      />

      <RankingSection rankedProducts={rankedProducts} />

      <ProductRail
        title="지금 바로 배송 가능"
        products={readyToShip}
        moreHref="/new-arrivals"
      />

      <SellTradeCTA />

      <ProductRail
        title="이번 주 가격 하락 상품"
        products={priceDrops}
        moreHref="/promotions"
      />

      <AuthenticationGuide />
    </>
  );
}
