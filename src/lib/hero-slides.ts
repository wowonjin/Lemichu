import { adminRequestHeaders, assertApiOk } from "@/lib/admin-client";
import { heroSlides as defaultHeroSlides, type HeroSlide } from "@/data/campaigns";

export type StoreHeroSlide = HeroSlide & {
  visible: boolean;
  order: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type HeroSlideInput = Omit<StoreHeroSlide, "id" | "createdAt" | "updatedAt">;

export function defaultStoreHeroSlides(): StoreHeroSlide[] {
  return defaultHeroSlides.map((slide, index) => ({
    ...slide,
    dark: Boolean(slide.dark),
    visible: true,
    order: index,
  }));
}

export function toHeroSlide(slide: StoreHeroSlide): HeroSlide {
  return {
    id: slide.id,
    eyebrow: slide.eyebrow,
    title: slide.title,
    subtitle: slide.subtitle,
    ctaLabel: slide.ctaLabel,
    ctaHref: slide.ctaHref,
    image: slide.image,
    dark: slide.dark,
  };
}

async function adminHeroFetch(init?: RequestInit, path = "/api/admin/hero-slides") {
  return assertApiOk(
    await fetch(path, {
      cache: "no-store",
      ...init,
      headers: {
        ...(await adminRequestHeaders()),
        ...(init?.headers ?? {}),
      },
    }),
    "슬라이드를 처리하지 못했어요."
  );
}

export async function fetchHeroSlides(): Promise<StoreHeroSlide[]> {
  const json = await adminHeroFetch();
  return (Array.isArray(json.slides) ? json.slides : []) as StoreHeroSlide[];
}

export async function createHeroSlide(input: HeroSlideInput): Promise<string> {
  const json = await adminHeroFetch({
    method: "POST",
    body: JSON.stringify(input),
  });
  return String(json.id ?? "");
}

export async function updateHeroSlide(id: string, input: Partial<HeroSlideInput>) {
  await adminHeroFetch(
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    `/api/admin/hero-slides/${id}`
  );
}

export async function deleteHeroSlide(id: string) {
  await adminHeroFetch({ method: "DELETE" }, `/api/admin/hero-slides/${id}`);
}

export async function reorderHeroSlides(ids: string[]) {
  await adminHeroFetch({
    method: "POST",
    body: JSON.stringify({ action: "reorder", ids }),
  });
}

export async function seedHeroSlides() {
  const json = await adminHeroFetch({
    method: "POST",
    body: JSON.stringify({ action: "seed" }),
  });
  return (Array.isArray(json.slides) ? json.slides : []) as StoreHeroSlide[];
}
