import Link from "next/link";

const columns = [
  {
    title: "쇼핑",
    links: [
      { label: "랭킹", href: "/ranking" },
      { label: "신규입고", href: "/new-arrivals" },
      { label: "기획전", href: "/promotions" },
      { label: "중고명품", href: "/pre-owned" },
      { label: "브랜드관", href: "/brand" },
    ],
  },
  {
    title: "판매",
    links: [
      { label: "내 명품 판매하기", href: "/sell" },
      { label: "판매 절차 안내", href: "/sell/guide" },
      { label: "예상 시세 확인", href: "/sell/estimate" },
      { label: "위탁 판매", href: "/sell/consignment" },
    ],
  },
  {
    title: "고객지원",
    links: [
      { label: "정품 검수 안내", href: "/authentication" },
      { label: "가품 보상 정책", href: "/policy/guarantee" },
      { label: "배송/교환/반품", href: "/policy/delivery" },
      { label: "자주 묻는 질문", href: "/faq" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[#f7f8f9]">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Brand + trust */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LEMICHU" className="h-6 w-auto" />
            <div className="mt-5 max-w-sm space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>고객센터 010-2178-0091 | 이메일 lemichu@naver.com</p>
              <p>운영시간 평일 10:00 - 18:00 | 점심시간 12:30 - 13:30</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                <Link
                  href="/privacy"
                  className="font-medium text-foreground transition-colors hover:text-gold"
                >
                  개인정보 처리 방침
                </Link>
                <Link
                  href="/terms"
                  className="font-medium text-foreground transition-colors hover:text-gold"
                >
                  이용약관
                </Link>
              </div>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/50 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>레미츄 | 대표 배살렘 | 사업자등록번호 142-17-02111 | 통신판매업 2024-서울중랑-1242</p>
          <p>© 2026 LEMICHU. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
