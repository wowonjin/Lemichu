import { ChevronDown } from "lucide-react";

type FaqItem = {
  q: string;
  a: React.ReactNode;
};

const faqItems: FaqItem[] = [
  {
    q: "배송은 얼마나 걸리나요?",
    a: <>무료배송 및 국내배송으로 평균 <strong className="font-semibold text-foreground">1~3일</strong> 안으로 받아보실 수 있습니다.</>,
  },
  {
    q: "정품인가요?",
    a: <>네, 100% 정품입니다. 레미츄에서 판매하는 모든 제품은 정품으로 가품은 취급하지 않습니다.</>,
  },
  {
    q: "사진 속 상품을 그대로 받을 수 있나요?",
    a: <>네, 상세페이지에 등록된 실제 상품을 그대로 보내드립니다. 중고명품은 상품마다 상태가 다르므로 실제 상품을 직접 촬영해 안내하고 있습니다.</>,
  },
  {
    q: "구성품은 무엇이 포함되나요?",
    a: <>가방, 더스트백, 박스, 쇼핑백 등 구성품은 상품마다 다릅니다. 각 상품 상세페이지에 기재된 구성품을 기준으로 발송됩니다.</>,
  },
  {
    q: "품절된 상품은 다시 구매할 수 있나요?",
    a: <>중고명품은 대부분 하나만 보유한 단일 상품으로 판매가 완료되면 재구매가 어려울 수 있습니다. 원하는 상품은 품절되기 전에 구매하시는 것을 권장드립니다.</>,
  },
  {
    q: "가지고 있는 명품도 판매할 수 있나요?",
    a: <>네, 레미츄에서는 중고명품 매입 상담을 진행합니다. 내 명품 판매하기를 통해 상품 사진과 정보를 남겨주시면 검토 후 매입 가능 여부와 진행 절차를 안내해 드립니다.</>,
  },
];

export function ProductFaq() {
  return (
    <section>
      <div className="max-w-[640px]">
        <h2 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[30px]">
          자주 묻는 질문
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
          구매 전 자주 묻는 내용을 모았습니다.
        </p>
      </div>

      <div className="mt-6 border-t border-[#EEEEEE] dark:border-border md:mt-8">
        {faqItems.map((item) => (
          <details key={item.q} className="group border-b border-[#EEEEEE] dark:border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-left text-[14px] font-medium text-foreground md:py-4 md:text-[15px] [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown className="size-4 shrink-0 text-[#8B8B8B] transition-transform duration-200 group-open:rotate-180 dark:text-muted-foreground" />
            </summary>
            <div className="pb-4 pr-8 text-[13px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[14px]">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
