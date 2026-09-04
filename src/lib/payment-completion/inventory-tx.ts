import "server-only";

import {
  FieldValue,
  type DocumentReference,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import type { OrderItemSnapshot } from "@/lib/checkout";
import {
  applyInventoryItems,
  revertInventoryItems,
  type InventoryUpdate,
} from "@/lib/payment-completion/inventory";

export async function computeInventoryUpdates(
  db: Firestore,
  tx: Transaction,
  items: OrderItemSnapshot[],
  mode: "apply" | "revert" = "apply"
): Promise<Array<{ ref: DocumentReference; update: InventoryUpdate }>> {
  const itemsByProduct = new Map<string, OrderItemSnapshot[]>();
  for (const item of items) {
    const current = itemsByProduct.get(item.productId) ?? [];
    current.push(item);
    itemsByProduct.set(item.productId, current);
  }

  const entries = [...itemsByProduct.entries()].map(([productId, productItems]) => ({
    productItems,
    ref: db.collection("products").doc(productId),
  }));
  const snapshots = await Promise.all(entries.map((entry) => tx.get(entry.ref)));

  return entries.map((entry, index) => {
    const snapshot = snapshots[index];
    if (!snapshot?.exists) throw new Error("INVENTORY_PRODUCT_NOT_FOUND");
    return {
      ref: entry.ref,
      update:
        mode === "revert"
          ? revertInventoryItems(snapshot.data() ?? {}, entry.productItems)
          : applyInventoryItems(snapshot.data() ?? {}, entry.productItems),
    };
  });
}

export function writeInventoryUpdates(
  tx: Transaction,
  updates: Array<{ ref: DocumentReference; update: InventoryUpdate }>
) {
  for (const { ref, update } of updates) {
    tx.update(ref, {
      ...update,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}
