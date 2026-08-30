export type Brand = {
  id: string;
  name: string;
  /** uppercase wordmark shown in the brand wall */
  wordmark: string;
  href: string;
  aliases?: string[];
};

export const brands: Brand[] = [
  { id: "prada", name: "프라다", wordmark: "PRADA", href: "/brand/prada" },
  { id: "celine", name: "셀린느", wordmark: "CELINE", href: "/brand/celine" },
  { id: "miu-miu", name: "미우미우", wordmark: "Miu Miu", href: "/brand/miu-miu" },
  { id: "louis-vuitton", name: "루이비통", wordmark: "Louis Vuitton", href: "/brand/louis-vuitton" },
  { id: "chanel", name: "샤넬", wordmark: "CHANEL", href: "/brand/chanel" },
  { id: "dior", name: "디올", wordmark: "Dior", href: "/brand/dior" },
  { id: "loewe", name: "로에베", wordmark: "LOEWE", href: "/brand/loewe" },
  {
    id: "saint-laurent",
    name: "생로랑",
    wordmark: "SAINT LAURENT",
    href: "/brand/saint-laurent",
    aliases: ["ysl", "생 로랑", "입생로랑", "saint laurent", "saint-laurent"],
  },
  { id: "gucci", name: "구찌", wordmark: "GUCCI", href: "/brand/gucci", aliases: ["구치"] },
  {
    id: "chrome-hearts",
    name: "크롬하츠",
    wordmark: "Chrome Hearts",
    href: "/brand/chrome-hearts",
    aliases: ["크롬 하츠", "chromehearts"],
  },
  {
    id: "cartier",
    name: "까르띠에",
    wordmark: "Cartier",
    href: "/brand/cartier",
    aliases: ["카르티에"],
  },
  {
    id: "hermes",
    name: "에르메스",
    wordmark: "HERMÈS",
    href: "/brand/hermes",
    aliases: ["hermès", "에르메스 파리"],
  },
  { id: "maison-margiela", name: "메종 마르지엘라", wordmark: "Maison Margiela", href: "/brand/maison-margiela" },
  {
    id: "ferragamo",
    name: "페라가모",
    wordmark: "FERRAGAMO",
    href: "/brand/ferragamo",
    aliases: ["salvatore ferragamo", "살바토레 페라가모"],
  },
  { id: "valentino", name: "발렌티노", wordmark: "Valentino", href: "/brand/valentino" },
  { id: "goyard", name: "고야드", wordmark: "GOYARD", href: "/brand/goyard" },
  { id: "max-mara", name: "막스마라", wordmark: "Max Mara", href: "/brand/max-mara" },
  { id: "the-row", name: "더로우", wordmark: "The Row", href: "/brand/the-row" },
  { id: "calvin-klein", name: "캘빈클라인", wordmark: "Calvin Klein", href: "/brand/calvin-klein" },
  { id: "polo-ralph-lauren", name: "폴로 랄프로렌", wordmark: "Polo Ralph Lauren", href: "/brand/polo-ralph-lauren" },
  { id: "ami-paris", name: "아미 파리스", wordmark: "AMI PARIS", href: "/brand/ami-paris" },
];
