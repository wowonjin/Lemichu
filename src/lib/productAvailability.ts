import { getProductAvailability } from "@/lib/wishlist";
import type { Product } from "@/types/product";

export function isOnSaleProduct(product: Product) {
  return getProductAvailability(product) === "available";
}

export function excludeSoldProducts<T extends Product>(products: T[]) {
  return products.filter((product) => getProductAvailability(product) !== "sold");
}

export function sortProductsByAvailability<T extends Product>(products: T[]) {
  return [...products].sort((left, right) => {
    const rank = (item: Product) => {
      const availability = getProductAvailability(item);
      if (availability === "available") return 0;
      if (availability === "sold") return 2;
      return 1;
    };
    return rank(left) - rank(right);
  });
}
