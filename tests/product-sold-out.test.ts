import { describe, expect, it } from "vitest";
import { buildSoldOutUpdate } from "@/lib/product-sold-out";

describe("buildSoldOutUpdate", () => {
  it("marks option stock sold out so the product can no longer be purchased", () => {
    const update = buildSoldOutUpdate(
      {
        stockQuantity: 1,
        variants: [
          {
            id: "bunjang-421106952-v001",
            color: "블랙",
            size: "OS",
            surchargeKrw: 0,
            stockStatus: "quantity_managed",
            quantity: 1,
          },
        ],
      },
      true
    );

    expect(update).toEqual({
      availability: "sold",
      stockQuantity: 0,
      variants: [
        {
          id: "bunjang-421106952-v001",
          color: "블랙",
          size: "OS",
          surchargeKrw: 0,
          stockStatus: "soldout",
          quantity: 0,
        },
      ],
    });
  });

  it("restores a sold product to a single sellable option", () => {
    const update = buildSoldOutUpdate(
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
      false
    );

    expect(update.availability).toBe("available");
    expect(update.stockQuantity).toBe(1);
    expect(update.variants?.[0]).toMatchObject({
      stockStatus: "quantity_managed",
      quantity: 1,
    });
  });
});
