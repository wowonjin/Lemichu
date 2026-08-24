"use client";

import { useEffect } from "react";
import { recordProductView } from "@/lib/product-signals";
import { addRecentlyViewed } from "@/lib/recentlyViewed";

export function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => {
    addRecentlyViewed(productId);
    recordProductView(productId);
  }, [productId]);

  return null;
}
