import { Plus } from "lucide-react";

type FaqItem = {
  q: string;
  a: React.ReactNode;
};

const faqItems: FaqItem[] = [
  {
    q: "배송은 얼마나 걸리나요?",
    a: <>대부분의 상품은 주문 후 해외 현지에서 구매하여 발송되며, 평균 <strong className="font-semibold text-foreground">8-15일</strong> 정도 소요됩니다. 상품 종류와 재고 상황에 따라 배송 기간은 달라질 수 있으며, 출고 후에는 배송조회가 가능합니다.</>,
  },
  {
    q: "정품인가요?",
    a: <>네. 레미츄는 유럽, 일본 현지 공식 매장, 백화점 및 공식 유통처를 통해 상품을 구매하여 판매합니다. 모든 상품은 출고 전 검수를 거쳐 발송되며, 가품은 취급하지 않습니다.</>,
  },
  {
    q: "쇼핑백도 포함되나요?",
    a: <>브랜드와 상품에 따라 제공 여부가 다릅니다. 가능한 경우 함께 동봉해 드리며, 구성품은 상품 상세 페이지 또는 문의를 통해 확인해 주세요.</>,
  },
  {
    q: "관부가세가 발생하나요?",
    a: <>모든 상품은 <strong className="font-semibold text-foreground">관세 및 부가세 포함 가격</strong>으로 판매되어 추가 비용 없이 받아보실 수 있습니다. 일부 고가 상품이나 특별한 경우에는 별도로 안내드립니다.</>,
  },
  {
    q: "교환 또는 반품이 가능한가요?",
    a: <>레미츄는 고객님의 주문에 맞춰 구매하는 구매대행 방식으로 운영됩니다. 단순 변심, 옵션 선택 오류 등 고객 사유로 인한 취소 및 반품은 어렵습니다.<br /><br />상품 하자, 오배송 또는 판매자의 과실이 있는 경우에는 확인 후 교환 또는 환불을 도와드립니다. 상품 수령 후 이상이 있는 경우 1-2일 내 고객센터로 문의해 주세요.</>,
  },
  {
    q: "선물 포장이 가능한가요?",
    a: <>가능합니다. 대부분의 상품은 브랜드 기본 포장 상태를 최대한 유지하여 발송합니다. 선물용 구매 시 주문 전 고객센터로 문의해 주시면 가능한 범위 안에서 안내드리겠습니다.</>,
  },
];

export function ProductFaq() {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">자주 묻는 질문</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">구매 전 자주 묻는 내용을 모았습니다.</p>

      <div className="mt-6 divide-y divide-border border-y border-border">
        {faqItems.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
              <span className="flex items-start gap-2">
                <span className="font-serif text-gold">Q.</span>
                {item.q}
              </span>
              <Plus className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" />
            </summary>
            <div className="pb-5 pl-6 pr-2 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
