export function recordProductView(productId: string) {
  const id = productId.trim();
  if (!id || typeof window === "undefined") return;

  const sessionKey = `lemichu.product-view.${id}`;
  try {
    if (window.sessionStorage.getItem(sessionKey)) return;
    window.sessionStorage.setItem(sessionKey, "1");
  } catch {
    // Private mode can block sessionStorage; still send once per mount.
  }

  void fetch("/api/product-signals/view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: id }),
    keepalive: true,
  }).catch(() => {
    // Ranking signals should not block browsing.
  });
}

export function recordProductWishDelta(productId: string, delta: 1 | -1) {
  const id = productId.trim();
  if (!id) return;

  void fetch("/api/product-signals/wish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: id, delta }),
    keepalive: true,
  }).catch(() => {
    // Ranking signals should not block wishlist toggles.
  });
}
