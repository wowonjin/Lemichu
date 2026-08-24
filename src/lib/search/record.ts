import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { revalidateTag } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { isSearchSource, normalizeSearchKeyword, searchCounterDocId } from "@/lib/search/normalize";
import type { SearchSource } from "@/lib/search/types";

export async function recordCustomerSearchEvent(input: {
  keyword: string;
  source?: unknown;
  uid?: string | null;
  usedOnly?: boolean;
}) {
  const normalized = normalizeSearchKeyword(input.keyword);
  if (!normalized) return { ok: false as const, reason: "invalid" as const };

  const source: SearchSource = isSearchSource(input.source) ? input.source : "submit";
  const db = getAdminDb();
  const counterRef = db.collection("searchCounters").doc(searchCounterDocId(normalized.key));
  const eventRef = db.collection("searchEvents").doc();

  await db.runTransaction(async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const previousCount = Number(counterSnap.data()?.count ?? 0);
    const count = Number.isFinite(previousCount) ? previousCount + 1 : 1;

    tx.set(
      counterRef,
      {
        keyword: normalized.display,
        normalized: normalized.key,
        count,
        lastSearchedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(eventRef, {
      keyword: normalized.display,
      normalized: normalized.key,
      uid: input.uid ?? null,
      source,
      usedOnly: Boolean(input.usedOnly),
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  try {
    await refreshPopularRanking();
    revalidateTag("search-discovery", "max");
  } catch (error) {
    console.error("[search] failed to refresh popular ranking", error);
  }

  return { ok: true as const };
}

async function refreshPopularRanking() {
  const db = getAdminDb();
  const snapshot = await db.collection("searchCounters").orderBy("count", "desc").limit(10).get();
  const items = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const keyword = typeof data.keyword === "string" ? data.keyword.trim() : "";
      return keyword
        ? { keyword, count: typeof data.count === "number" ? data.count : 0 }
        : null;
    })
    .filter((item): item is { keyword: string; count: number } => Boolean(item));

  await db.collection("searchStats").doc("popular").set({
    items,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
