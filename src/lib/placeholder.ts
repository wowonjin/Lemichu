/**
 * Deterministic, tasteful gradient generator used as a premium image
 * placeholder when no real product photography is available.
 * Tones are kept muted and neutral to avoid a yellow cast.
 */
const PALETTES: [string, string, string][] = [
  ["#f7f8f9", "#dde1e6", "#aeb7c2"], // mist gray
  ["#f4f6f8", "#d7dde3", "#9faab7"], // cool slate
  ["#f1f3f5", "#d3d8de", "#98a2ad"], // soft graphite
  ["#f8f9fa", "#e1e5ea", "#b4bec9"], // cloud gray
  ["#eef1f4", "#cbd3dc", "#929eab"], // steel gray
  ["#f5f7f9", "#dce2e8", "#a8b3bf"], // pale blue gray
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getPlaceholderGradient(seed: string): string {
  const palette = PALETTES[hashSeed(seed) % PALETTES.length];
  const angle = 120 + (hashSeed(seed) % 60);
  return `linear-gradient(${angle}deg, ${palette[0]} 0%, ${palette[1]} 52%, ${palette[2]} 100%)`;
}

export function isRealImage(url: string): boolean {
  return /^https?:\/\//.test(url) || url.startsWith("/");
}

const TEMP_IMAGE_URLS = [
  "/quick-products/new.png",
  "/quick-products/best.png",
  "/quick-products/pre-owned.png",
  "/quick-products/women.png",
  "/quick-products/men.png",
  "/quick-products/wallet.png",
  "/quick-products/shoes.png",
  "/quick-products/watch.png",
  "/quick-products/jewelry.png",
];

export function getTemporaryImageUrl(seed: string): string {
  return TEMP_IMAGE_URLS[hashSeed(seed) % TEMP_IMAGE_URLS.length];
}
