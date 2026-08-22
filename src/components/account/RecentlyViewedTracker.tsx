"use client";

import { useEffect } from "react";
import { addRecentlyViewed } from "@/lib/recentlyViewed";

export function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => {
    addRecentlyViewed(productId);
  }, [productId]);

  return null;
}
