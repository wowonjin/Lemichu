import { describe, expect, it } from "vitest";
import {
  applyInventoryItems,
  revertInventoryItems,
} from "@/lib/payment-completion/inventory";
import { isSoldProduct } from "@/components/product/SoldOutOverlay";

describe("payment inventory updates", () => {
  it("decrements quantity-managed stock exactly once per requested quantity", () => {
    const result = applyInventoryItems(
      {
        stockQuantity: 3,
        variants: [
          {
            id: "black-m",
            color: "Black",
            size: "M",
            surchargeKrw: 0,
            stockStatus: "quantity_managed",
            quantity: 3,
          },
        ],
      },
      [{ variantId: "black-m", quantity: 2 }]
    );
    expect(result.stockQuantity).toBe(1);
    expect(result.variants?.[0]).toMatchObject({
      stockStatus: "quantity_managed",
      quantity: 1,
    });
  });

  it("marks a one-off available variant sold out", () => {
    const result = applyInventoryItems(
      {
        stockQuantity: 1,
        variants: [
          {
            id: "one",
            surchargeKrw: 0,
            stockStatus: "available",
          },
        ],
      },
      [{ variantId: "one", quantity: 1 }]
    );
    expect(result.stockQuantity).toBe(0);
    expect(result.variants?.[0]?.stockStatus).toBe("soldout");
  });

  it("rejects insufficient or already sold inventory", () => {
    expect(() =>
      applyInventoryItems(
        {
          stockQuantity: 1,
          variants: [
            {
              id: "one",
              surchargeKrw: 0,
              stockStatus: "soldout",
            },
          ],
        },
        [{ variantId: "one", quantity: 1 }]
      )
    ).toThrow("INSUFFICIENT_INVENTORY");
  });

  it("restores a one-off sold variant", () => {
    const result = revertInventoryItems(
      {
        stockQuantity: 0,
        variants: [
          {
            id: "one",
            surchargeKrw: 0,
            stockStatus: "soldout",
            quantity: 0,
          },
        ],
      },
      [{ variantId: "one", quantity: 1 }]
    );
    expect(result.stockQuantity).toBe(1);
    expect(result.variants?.[0]).toMatchObject({
      id: "one",
      stockStatus: "available",
    });
    expect(result.variants?.[0]).not.toHaveProperty("quantity");
  });

  it("restores quantity-managed stock", () => {
    const result = revertInventoryItems(
      {
        stockQuantity: 1,
        variants: [
          {
            id: "black-m",
            surchargeKrw: 0,
            stockStatus: "quantity_managed",
            quantity: 1,
          },
        ],
      },
      [{ variantId: "black-m", quantity: 2 }]
    );
    expect(result.stockQuantity).toBe(3);
    expect(result.variants?.[0]).toMatchObject({
      stockStatus: "quantity_managed",
      quantity: 3,
    });
  });
});

describe("sold product display", () => {
  it("treats ordered-out stock as sold for the overlay", () => {
    expect(isSoldProduct({ availability: "sold" })).toBe(true);
    expect(isSoldProduct({ availability: "temporarily_unavailable" })).toBe(true);
    expect(isSoldProduct({ availability: "available" })).toBe(false);
  });
});
