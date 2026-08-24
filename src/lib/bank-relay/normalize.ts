export function normalizeDepositorName(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function isValidDepositorName(value: string): boolean {
  const normalized = normalizeDepositorName(value);
  return normalized.length >= 1 && normalized.length <= 40 && !/[\r\n\t]/.test(normalized);
}
