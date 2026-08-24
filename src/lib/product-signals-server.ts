import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  EMPTY_PRODUCT_SIGNALS,
  PRODUCT_SIGNAL_COLLECTION,
  type ProductSignals,
} from "@/lib/home-sections";
import type { OrderStatus } from "@/lib/orders";

const REVENUE_STATUSES = new Set<OrderStatus>(["paid", "preparing", "shipping", "delivered"]);

function toMillis(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const timestamp = value as { toMillis?: () => number; seconds?: number; _seconds?: number };
  if (typeof timestamp.toMillis === "function") {
    try {
      return timestamp.toMillis();
    } catch {
      return undefined;
    }
  }
  const seconds = timestamp.seconds ?? timestamp._seconds;
  return typeof seconds === "number" ? seconds * 1000 : undefined;
}

async function loadStoredSignals(): Promise<Map<string, ProductSignals>> {
  const map = new Map<string, ProductSignals>();

  try {
    const snapshot = await getAdminDb().collection(PRODUCT_SIGNAL_COLLECTION).get();
    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, unknown>;
      map.set(doc.id, {
        viewCount: Math.max(0, Number(data.viewCount) || 0),
        wishCount: Math.max(0, Number(data.wishCount) || 0),
        salesCount: Math.max(0, Number(data.salesCount) || 0),
        lastViewedAt: toMillis(data.lastViewedAt),
      });
    }
  } catch (error) {
    console.error("[product-signals] failed to load stored signals", error);
  }

  return map;
}

async function loadSalesCounts(): Promise<Map<string, number>> {
  const sales = new Map<string, number>();

  try {
    const snapshot = await getAdminDb().collection("orders").get();
    for (const doc of snapshot.docs) {
      const data = doc.data() as {
        status?: OrderStatus;
        items?: Array<{ productId?: string; quantity?: number }>;
      };
      if (!data.status || !REVENUE_STATUSES.has(data.status)) continue;
      for (const item of data.items ?? []) {
        if (!item.productId) continue;
        const quantity = Number(item.quantity);
        sales.set(item.productId, (sales.get(item.productId) ?? 0) + (Number.isFinite(quantity) ? quantity : 1));
      }
    }
  } catch (error) {
    console.error("[product-signals] failed to load sales counts", error);
  }

  return sales;
}

async function loadMergedSignals(): Promise<Array<[string, ProductSignals]>> {
  const [stored, sales] = await Promise.all([loadStoredSignals(), loadSalesCounts()]);
  const ids = new Set([...stored.keys(), ...sales.keys()]);
  const merged: Array<[string, ProductSignals]> = [];

  for (const id of ids) {
    const base = stored.get(id) ?? EMPTY_PRODUCT_SIGNALS;
    merged.push([
      id,
      {
        ...base,
        salesCount: sales.get(id) ?? base.salesCount,
      },
    ]);
  }

  return merged;
}

const getCachedSignals = unstable_cache(loadMergedSignals, ["product-signals-v1"], {
  revalidate: 30,
  tags: ["product-signals"],
});

export const getProductSignalMap = cache(async () => {
  return new Map(await getCachedSignals());
});

export async function incrementProductSignal(
  productId: string,
  field: "viewCount" | "wishCount",
  delta = 1
) {
  const id = productId.trim();
  if (!id || !Number.isFinite(delta) || delta === 0) return;

  const db = getAdminDb();
  const ref = db.collection(PRODUCT_SIGNAL_COLLECTION).doc(id);
  const payload: Record<string, unknown> = {
    [field]: FieldValue.increment(delta),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (field === "viewCount") {
    payload.lastViewedAt = FieldValue.serverTimestamp();
  }

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = Number(snap.data()?.[field] ?? 0);
    if (field === "wishCount" && current + delta < 0) {
      tx.set(ref, { wishCount: 0, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return;
    }
    tx.set(ref, payload, { merge: true });
  });
}
