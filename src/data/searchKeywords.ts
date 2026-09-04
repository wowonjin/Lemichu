export const recommendedKeywords = [
  "루이비통",
  "샤넬",
  "프라다",
  "셀린느",
  "중고명품",
  "가방",
  "시계",
  "지갑",
  "에르메스",
  "디올",
];

export const popularKeywords = [
  "루이비통",
  "샤넬",
  "프라다",
  "셀린느",
  "구찌",
  "에르메스",
  "디올",
  "미우미우",
  "롤렉스",
  "보테가베네타",
];

export const searchCategoryShortcuts = [
  { label: "여성가방", href: "/category/women-bags" },
  { label: "남성가방", href: "/category/men-bags" },
  { label: "지갑", href: "/category/wallets" },
  { label: "시계", href: "/category/watches" },
  { label: "주얼리", href: "/category/jewelry" },
  { label: "중고명품", href: "/products" },
];

export function formatPopularUpdatedAt(date?: Date | string | null) {
  if (!date) return "인기순 기준";

  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "인기순 기준";

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(value);
  const readPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  const month = readPart("month");
  const day = readPart("day");
  const hour = readPart("hour");
  return `${month}.${day} ${hour}:00 기준`;
}
