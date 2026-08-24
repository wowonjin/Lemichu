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

const companyFacts = [
  { label: "상호", value: "레미츄" },
  { label: "대표", value: "배살렘" },
  { label: "사업자등록번호", value: "142-17-02111" },
  { label: "통신판매업", value: "2024-서울중랑-1242" },
];

const FTC_BIZ_URL = "https://www.ftc.go.kr/bizCommPop.do?wrkr_no=1421702111";

function FactDivider() {
  return (
    <span aria-hidden className="mx-2.5 select-none text-border">
      ·
    </span>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-sand">
      <div className="container py-12 md:py-14">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LEMICHU" className="h-6 w-auto dark:invert" />

            <div className="mt-8">
              <p className="text-sm font-semibold text-foreground">고객센터</p>
              <a
                href="tel:01021780091"
                className="mt-3 inline-block text-[22px] font-semibold leading-none tracking-tight text-foreground transition-colors hover:text-gold"
              >
                010-2178-0091
              </a>
              <a
                href="mailto:lemichu@naver.com"
                className="mt-2.5 block text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                lemichu@naver.com
              </a>

              <dl className="mt-5 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <div className="flex gap-3">
                  <dt className="w-[3.25rem] shrink-0 text-muted-foreground/70">운영시간</dt>
                  <dd>평일 10:00 – 18:00</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-[3.25rem] shrink-0 text-muted-foreground/70">점심시간</dt>
                  <dd>12:30 – 13:30</dd>
                </div>
              </dl>
            </div>
          </div>

          <nav className="grid grid-cols-3 gap-x-10 sm:gap-x-14 md:gap-x-16 lg:gap-x-20">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
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
          </nav>
        </div>

        <div className="mt-12 border-t border-border/60 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <nav className="flex items-center gap-3 text-[13px]">
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground transition-colors hover:text-gold"
              >
                개인정보 처리방침
              </Link>
              <span aria-hidden className="h-3 w-px bg-border" />
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                이용약관
              </Link>
            </nav>
            <p className="text-[11px] text-muted-foreground/80">
              © 2026 LEMICHU. All rights reserved.
            </p>
          </div>

          <div className="mt-4 space-y-1 text-[11px] leading-6 text-muted-foreground">
            <p className="flex flex-wrap items-center">
              {companyFacts.map((fact, index) => (
                <span key={fact.label} className="inline-flex items-center">
                  {index > 0 ? <FactDivider /> : null}
                  <span className="text-muted-foreground/65">{fact.label}</span>
                  <span className="ml-1.5">{fact.value}</span>
                  {fact.label === "사업자등록번호" ? (
                    <a
                      href={FTC_BIZ_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1.5 underline underline-offset-2 transition-colors hover:text-foreground"
                    >
                      사업자정보확인
                    </a>
                  ) : null}
                </span>
              ))}
            </p>
            <p>
              <span className="text-muted-foreground/65">사업장 소재지</span>
              <span className="ml-1.5">서울시 상봉로 23길 11, 804호</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
