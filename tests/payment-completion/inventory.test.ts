import { describe, expect, it } from "vitest";
import { applyInventoryItems } from "@/lib/payment-completion/inventory";

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
});
