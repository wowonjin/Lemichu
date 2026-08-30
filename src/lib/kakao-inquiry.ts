const LOCAL_HOST = /localhost|127\.0\.0\.1/i;
const DEFAULT_KAKAO_CHANNEL_URL = "https://pf.kakao.com/_xfmkgn";

export const PRODUCTION_SITE_URL = "https://lemichu.shop";

export type ProductInquiryContext = {
  productId: string;
  brand?: string;
  name?: string;
  color?: string;
  size?: string;
};

export function getPublicSiteUrl(): string {
  if (typeof window !== "undefined" && !LOCAL_HOST.test(window.location.hostname)) {
    return window.location.origin.replace(/\/$/, "");
  }

  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (envBase && !LOCAL_HOST.test(envBase)) {
    return envBase;
  }

  return PRODUCTION_SITE_URL;
}

export function getPublicProductUrl(productId: string): string {
  return `${getPublicSiteUrl()}/product/${encodeURIComponent(productId)}`;
}

export function toAbsolutePublicUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = getPublicSiteUrl();
  return `${origin}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function getKakaoChannelUrl(): string {
  const raw = process.env.NEXT_PUBLIC_KAKAO_CHAT_URL?.trim() || DEFAULT_KAKAO_CHANNEL_URL;

  try {
    const url = new URL(raw);
    url.pathname = url.pathname.replace(/\/chat\/?$/, "") || "/";
    return url.toString();
  } catch {
    return DEFAULT_KAKAO_CHANNEL_URL;
  }
}

export function getKakaoChatUrl(): string {
  const raw = process.env.NEXT_PUBLIC_KAKAO_CHAT_URL?.trim() || DEFAULT_KAKAO_CHANNEL_URL;

  try {
    const url = new URL(raw);
    if (!url.pathname.endsWith("/chat")) {
      url.pathname = `${url.pathname.replace(/\/$/, "")}/chat`;
    }
    return url.toString();
  } catch {
    return `${DEFAULT_KAKAO_CHANNEL_URL}/chat`;
  }
}

export function getProductIdFromPathname(pathname: string): string | undefined {
  const match = pathname.match(/^\/product\/([^/?#]+)/);
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function buildOrderInquiryMessage(order: {
  id: string;
  orderNo?: string;
  itemName?: string;
}) {
  return [
    "[LEMICHU 주문 문의]",
    `주문번호: ${order.orderNo || order.id}`,
    order.itemName ? `상품: ${order.itemName}` : null,
    "",
    "안녕하세요. 위 주문 관련 문의드립니다.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function buildSellInquiryMessage(): string {
  return [
    "[LEMICHU 판매 문의]",
    "유입 경로: 내 명품 판매하기",
    "",
    "안녕하세요. 사이트에서 '내 명품 판매하기'를 눌러 연락드립니다.",
    "보유 중인 명품 판매를 문의합니다.",
  ].join("\n");
}

export function buildProductInquiryMessage(
  context: ProductInquiryContext,
  userMessage?: string
): string {
  const productUrl = getPublicProductUrl(context.productId);
  const productName = [context.brand, context.name].filter(Boolean).join(" ").trim();
  const lines = [
    productUrl,
    "",
    "[LEMICHU 상품 문의]",
    productName ? `상품명: ${productName}` : null,
    `상품번호: ${context.productId.toUpperCase()}`,
    context.color ? `색상: ${context.color}` : null,
    context.size ? `사이즈: ${context.size}` : null,
    `상품 페이지: ${productUrl}`,
    "",
    userMessage?.trim() || "안녕하세요. 위 상품 문의드립니다.",
  ];

  return lines.filter((line): line is string => line !== null).join("\n");
}

export function copyTextToClipboard(text: string): boolean {
  if (typeof document === "undefined") return false;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text).catch(() => undefined);
  }

  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.top = "0";
  el.style.left = "0";
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
  el.focus();
  el.select();
  el.setSelectionRange(0, text.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(el);
  }
}
