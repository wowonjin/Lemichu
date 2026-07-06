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
