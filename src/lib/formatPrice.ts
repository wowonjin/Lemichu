export function formatPrice(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(value));
}

export function formatPriceWithUnit(value: number): string {
  return `${formatPrice(value)}원`;
}

export function getDiscountRate(price: number, retailPrice?: number): number | undefined {
  if (!retailPrice || retailPrice <= price) return undefined;
  return Math.round(((retailPrice - price) / retailPrice) * 100);
}

export function getDiscountAmount(price: number, retailPrice?: number): number {
  if (!retailPrice || retailPrice <= price) return 0;
  return Math.round(retailPrice - price);
}

export function getPurchaseButtonLabel(
  price: number,
  retailPrice?: number,
  options?: { purchasing?: boolean; needsOption?: boolean }
): string {
  if (options?.purchasing) return "결제 준비 중...";

  const salePrice = formatPriceWithUnit(price);
  const discountAmount = getDiscountAmount(price, retailPrice);

  if (discountAmount >= 1000) {
    return `${formatPriceWithUnit(discountAmount)} 지금 할인받고 구매하기`;
  }
  if (options?.needsOption) return "옵션 선택하고 구매하기";
  return `${salePrice} 지금 구매하기`;
}
