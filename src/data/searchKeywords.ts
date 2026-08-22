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
  { label: "중고명품", href: "/pre-owned" },
];

export function formatPopularUpdatedAt(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  return `${month}.${day} ${hour}:00 기준`;
}
