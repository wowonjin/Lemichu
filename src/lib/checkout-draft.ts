export type CheckoutDraftItem = {
  productId: string;
  variantId?: string;
  brand: string;
  name: string;
  imageUrl: string;
  href: string;
  optionLabel?: string;
  unitPrice: number;
  retailPrice?: number;
  quantity: number;
};

export type CheckoutDraft = {
  items: CheckoutDraftItem[];
  /** 비회원 결제로 진입한 경우 guest. 로그인 여부와 무관하게 게스트 API를 사용합니다. */
  mode?: "guest" | "member";
  usePoints?: boolean;
  pointsToUse?: number;
  expectedEarn?: number;
  createdAt: number;
};

const STORAGE_KEY = "lemichu.checkout.draft.v1";

export function saveCheckoutDraft(draft: Omit<CheckoutDraft, "createdAt">): void {
  if (typeof window === "undefined") return;

  const payload: CheckoutDraft = {
    ...draft,
    createdAt: Date.now(),
  };

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / private-mode failures; checkout page will show empty state.
  }
}

export function readCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutDraft;
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearCheckoutDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
