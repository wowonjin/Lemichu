import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { CustomerPageShell } from "@/components/layout/CustomerPage";

export const metadata: Metadata = {
  title: "자주 묻는 질문 — LEMICHU",
};

const faqGroups = [
  {
    category: "배송",
    items: [
      {
        q: "배송은 얼마나 걸리나요?",
        a: "대부분의 상품은 주문 후 해외 현지에서 구매하여 발송되며, 평균 8-15일 정도 소요됩니다. ‘오늘출고’ 표기 상품은 국내에서 즉시 출고됩니다.",
      },
      {
        q: "배송 조회는 어떻게 하나요?",
        a: "마이페이지 > 배송 조회에서 실시간 배송 상태를 확인하실 수 있습니다.",
      },
    ],
  },
  {
    category: "정품/검수",
    items: [
      {
        q: "정품인가요?",
        a: "네. 레미츄는 공식 매장, 백화점 및 공식 유통처를 통해 상품을 확보하며, 모든 상품은 출고 전 검수를 거칩니다. 가품은 취급하지 않습니다.",
      },
      {
        q: "가품이면 어떻게 되나요?",
        a: "공인 감정 기관에서 가품으로 판정될 경우 결제 금액의 200%를 보상해드립니다.",
      },
    ],
  },
  {
    category: "결제/관부가세",
    items: [
      {
        q: "관부가세가 발생하나요?",
        a: "모든 상품은 관세 및 부가세 포함 가격으로 판매되어 추가 비용 없이 받아보실 수 있습니다.",
      },
      {
        q: "어떤 결제 수단을 사용할 수 있나요?",
        a: "신용/체크카드 및 간편결제를 지원합니다. 결제 수단은 마이페이지에서 관리할 수 있습니다.",
      },
    ],
  },
  {
    category: "교환/반품",
    items: [
      {
        q: "교환 또는 반품이 가능한가요?",
        a: "구매대행 방식 특성상 단순 변심에 의한 취소·반품은 어렵습니다. 다만 상품 하자나 오배송의 경우 수령 후 1-2일 내 고객센터로 문의해 주시면 도와드립니다.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <CustomerPageShell className="bg-white bg-none font-sans">
      <section>
        <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-end md:justify-between">
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            자주 묻는 질문
          </h1>
        </div>
        <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          배송, 정품 검수, 결제, 교환/반품 관련 궁금한 점을 카테고리별로 정리했습니다.
        </p>

        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-y border-border py-5 lg:sticky lg:top-36 lg:self-start">
            <h2 className="text-sm font-semibold text-foreground">카테고리</h2>
            <nav className="mt-4 divide-y divide-border">
              {faqGroups.map((group) => (
                <a
                  key={group.category}
                  href={`#faq-${group.category}`}
                  className="block py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {group.category}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-10">
          {faqGroups.map((group) => (
            <section key={group.category} id={`faq-${group.category}`}>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                {group.category}
              </h2>
              <div className="mt-3 divide-y divide-border border-y border-border">
                {group.items.map((item) => (
                  <details key={item.q} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                      <span className="flex items-start gap-3">
                        <span className="font-semibold text-muted-foreground">Q</span>
                        {item.q}
                      </span>
                      <Plus className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" />
                    </summary>
                    <div className="pb-5 pl-7 pr-2 text-sm leading-7 text-muted-foreground">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
          </div>
        </div>
      </section>
    </CustomerPageShell>
  );
}
