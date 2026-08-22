import "server-only";

import { heroSlides as fallbackSlides, type HeroSlide } from "@/data/campaigns";
import { getAdminDb } from "@/lib/firebase-admin";

function asSlide(id: string, data: Record<string, unknown>): HeroSlide {
  return {
    id,
    eyebrow: String(data.eyebrow ?? ""),
    title: String(data.title ?? ""),
    subtitle: String(data.subtitle ?? ""),
    ctaLabel: String(data.ctaLabel ?? ""),
    ctaHref: String(data.ctaHref ?? "/"),
    image: String(data.image ?? ""),
    dark: Boolean(data.dark),
  };
}

export async function getPublishedHeroSlides(): Promise<HeroSlide[]> {
  try {
    const snapshot = await getAdminDb().collection("heroSlides").get();
    const slides = snapshot.docs
      .map((slideDoc) => {
        const data = slideDoc.data() as Record<string, unknown>;
        return {
          slide: asSlide(slideDoc.id, data),
          visible: data.visible !== false,
          order: typeof data.order === "number" ? data.order : 0,
        };
      })
      .filter((item) => item.visible && item.slide.image && item.slide.title)
      .sort((a, b) => a.order - b.order)
      .map((item) => item.slide);

    return slides.length > 0 ? slides : fallbackSlides;
  } catch {
    return fallbackSlides;
  }
}
