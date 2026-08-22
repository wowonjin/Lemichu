const SEOUL_OFFSET = "+09:00";

function seoulDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "2026",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
  };
}

/** Today 23:59:59 in Asia/Seoul. Stable for the calendar day, not per visit. */
export function getTodaySaleEndMs(now = new Date()): number {
  const { year, month, day } = seoulDateParts(now);
  return new Date(`${year}-${month}-${day}T23:59:59${SEOUL_OFFSET}`).getTime();
}

export function getTodaySaleEndIso(now = new Date()): string | null {
  const endsAt = getTodaySaleEndMs(now);
  if (now.getTime() >= endsAt) return null;
  return new Date(endsAt).toISOString();
}

export function hashBetween(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  const span = max - min + 1;
  return min + (Math.abs(hash) % span);
}
