"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { getKakaoChatUrl } from "@/lib/kakao-inquiry";

const columns = [
  {
    title: "쇼핑",
    links: [
      { label: "전체 상품", href: "/products" },
      { label: "신규입고", href: "/products?filter=new" },
      { label: "명품가방", href: "/products?filter=bags" },
      { label: "지갑·카드지갑", href: "/products?filter=wallets" },
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
      { label: "카카오톡 상담", href: "kakao" },
      { label: "정품 검수 안내", href: "/authentication" },
      { label: "가품 보상 정책", href: "/policy/guarantee" },
      { label: "배송/교환/반품", href: "/policy/delivery" },
      { label: "비회원 주문조회", href: "/orders/lookup" },
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

function FooterLink({ href, children }: { href: string; children: string }) {
  const className =
    "text-[13px] leading-5 text-muted-foreground transition-colors hover:text-foreground md:text-sm";

  if (href === "kakao") {
    return (
      <a href={getKakaoChatUrl()} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function FooterAccordion() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav aria-label="푸터 메뉴" className="border-t border-border/70 md:hidden">
      {columns.map((col) => {
        const expanded = open === col.title;
        const panelId = `footer-${col.title}`;

        return (
          <div key={col.title} className="border-b border-border/70">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setOpen(expanded ? null : col.title)}
              className="flex h-12 w-full items-center justify-between text-left"
            >
              <span className="text-[14px] font-semibold tracking-tight text-foreground">
                {col.title}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform duration-200",
                  expanded && "rotate-180"
                )}
              />
            </button>
            <div id={panelId} hidden={!expanded} className="pb-3.5">
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function CustomerService() {
  return (
    <div>
      <p className="text-[13px] font-semibold tracking-tight text-foreground md:text-sm">
        고객센터
      </p>
      <a
        href="mailto:lemichu@naver.com"
        className="mt-2 block text-[15px] font-medium tracking-tight text-foreground transition-colors hover:text-gold md:mt-3 md:text-sm md:font-normal md:text-muted-foreground md:hover:text-foreground"
      >
        lemichu@naver.com
      </a>

      <dl className="mt-3 space-y-1 text-[12px] leading-5 text-muted-foreground md:mt-5 md:space-y-1.5 md:text-xs md:leading-relaxed">
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-muted-foreground/70">운영시간</dt>
          <dd>평일 10:00 – 18:00</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-muted-foreground/70">점심시간</dt>
          <dd>12:30 – 13:30</dd>
        </div>
      </dl>

      <a
        href={getKakaoChatUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex h-11 w-full items-center justify-center bg-[#FEE500] text-[13px] font-semibold text-[#191919] transition-opacity hover:opacity-90 max-md:-mx-4 max-md:w-[calc(100%+2rem)] md:mt-5 md:inline-flex md:h-9 md:w-auto md:rounded-md md:px-3.5"
      >
        카카오톡 상담
      </a>
    </div>
  );
}

function CompanyFacts() {
  return (
    <>
      <dl className="space-y-1.5 text-[11px] leading-5 text-muted-foreground md:hidden">
        {companyFacts.map((fact) => (
          <div key={fact.label} className="flex gap-3">
            <dt className="w-[5.25rem] shrink-0 text-muted-foreground/60">{fact.label}</dt>
            <dd>
              {fact.value}
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
            </dd>
          </div>
        ))}
        <div className="flex gap-3">
          <dt className="w-[5.25rem] shrink-0 text-muted-foreground/60">사업장 소재지</dt>
          <dd>서울시 상봉로 23길 11, 804호</dd>
        </div>
      </dl>

      <div className="hidden space-y-1 text-[11px] leading-6 text-muted-foreground md:block">
        <p className="flex flex-wrap items-center">
          {companyFacts.map((fact, index) => (
            <span key={fact.label} className="inline-flex items-center">
              {index > 0 ? (
                <span aria-hidden className="mx-2.5 select-none text-border">
                  ·
                </span>
              ) : null}
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
    </>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-sand pb-[var(--mobile-bottom-nav-offset)] md:pb-0">
      <div className="container min-w-0 py-8 md:py-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-12">
          <div className="md:max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LEMICHU" className="h-5 w-auto dark:invert md:h-6" />
            <div className="mt-5 md:mt-8">
              <CustomerService />
            </div>
          </div>

          <FooterAccordion />

          <nav aria-label="푸터 메뉴" className="hidden grid-cols-3 gap-x-14 md:grid lg:gap-x-20">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <FooterLink href={link.href}>{link.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-border/70 pt-5 md:mt-12 md:pt-6">
          <nav className="flex items-center gap-3 text-[12px] md:text-[13px]">
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

          <div className="mt-4">
            <CompanyFacts />
          </div>

          <p className="mt-5 text-[11px] text-muted-foreground/70">
            © 2026 LEMICHU. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
