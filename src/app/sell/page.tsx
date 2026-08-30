import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { authSteps, sellSteps } from "@/data/campaigns";
import { sellGuides } from "@/data/pageContent";

export const metadata: Metadata = {
  title: "내 명품 판매하기",
};

const saleMethods = [
  {
    title: "빠른 판매",
    description: "시세 확인 후 바로 판매 가능한 방법입니다.",
    href: "/sell/estimate",
  },
  {
    title: "위탁 판매",
    description: "촬영, 검수, 판매, 정산까지 레미츄가 대행합니다.",
    href: "/sell/consignment",
  },
  {
    title: "판매 절차",
    description: "접수부터 정산까지 전체 과정을 확인합니다.",
    href: "/sell/guide",
  },
];

export default function SellPage() {
  return (
    <CustomerPageShell className="bg-background font-sans">
      <section>
        <div className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-5xl">
              내 명품 판매하기
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              사진과 상태가 담긴 상세 시세를 확인하고, 검수 후 판매와 정산을 진행할 수 있습니다.
              복잡한 서류보다 접수와 진행 상태를 명확하게 볼 수 있도록 구성했습니다.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-3">
              <Link
                href="/sell/estimate"
                className="inline-flex h-11 w-full items-center justify-center bg-foreground px-6 text-sm font-semibold text-background transition-colors hover:bg-foreground/85 sm:h-12 sm:w-auto"
              >
                시세 확인하기
              </Link>
              <Link
                href="/sell/guide"
                className="inline-flex h-11 w-full items-center justify-center border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-foreground sm:h-12 sm:w-auto"
              >
                판매 절차 보기
              </Link>
            </div>
          </div>

          <div className="border-y border-border py-5">
            <p className="text-sm font-semibold text-foreground">판매 접수 안내</p>
            <dl className="mt-4 space-y-3 text-sm">
              <InfoRow label="접수 방법" value="사진 업로드 및 상담" />
              <InfoRow label="상세가 안내" value="시세와 등급 기반 산정" />
              <InfoRow label="정산 방법" value="판매 완료 후 계좌 정산" />
            </dl>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-10">
            <section>
              <SectionTitle title="판매 절차" href="/sell/guide" />
              <ol className="mt-4 divide-y divide-border border-y border-border">
                {sellSteps.map((step) => (
                  <li key={step.step} className="grid gap-3 py-5 md:grid-cols-[96px_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-muted-foreground">
                      STEP {step.step}
                    </span>
                    <div>
                      <p className="text-base font-semibold text-foreground">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <SectionTitle title="판매 방법 선택" />
              <div className="mt-4 grid border-y border-border md:grid-cols-3">
                {saleMethods.map((method, index) => (
                  <Link
                    key={method.title}
                    href={method.href}
                    className={`group p-5 transition-colors hover:bg-secondary ${
                      index > 0 ? "border-t border-border md:border-l md:border-t-0" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-foreground">{method.title}</p>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {method.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <SectionTitle title="검수 기준" href="/authentication" />
              <div className="mt-4 divide-y divide-border border-y border-border">
                {authSteps.slice(0, 4).map((step) => (
                  <div key={step.id} className="py-4">
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-8 lg:sticky lg:top-36 lg:self-start">
            <section className="border-y border-border py-5">
              <h2 className="text-base font-semibold text-foreground">판매 가이드</h2>
              <div className="mt-4 divide-y divide-border">
                {Object.values(sellGuides).map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/sell/${guide.slug}`}
                    className="block py-4 transition-colors hover:text-muted-foreground"
                  >
                    <p className="text-sm font-semibold text-foreground">{guide.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {guide.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="border-y border-border py-5">
              <h2 className="text-base font-semibold text-foreground">접수 전 확인</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>상품 전체, 하자 부위, 구성품 사진을 충분히 준비해 주세요.</li>
                <li>정품 확인이 어려운 상품은 접수가 제한될 수 있습니다.</li>
                <li>최종 판매가와 검수 결과는 실제 시세에 따라 달라질 수 있습니다.</li>
              </ul>
            </section>
          </aside>
        </div>
      </section>
    </CustomerPageShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          전체보기
        </Link>
      ) : null}
    </div>
  );
}
