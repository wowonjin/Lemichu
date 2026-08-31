import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { KakaoCsLink } from "@/components/account/KakaoCsLink";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { buildSellInquiryMessage } from "@/lib/kakao-inquiry";

export const metadata: Metadata = {
  title: "내 명품 판매하기",
};

const saleMethods = [
  {
    title: "즉시 매입 · 당일 현금",
    summary: "검수 후 바로 매입하고, 당일 계좌로 정산합니다.",
    points: [
      "사진과 상품 정보를 보내주시면 매입 가능 여부와 예상 매입가를 먼저 안내합니다.",
      "방문 접수 또는 택배로 상품을 보내주시면 실제 검수 후 최종 금액을 확정합니다.",
      "검수가 끝나면 당일 계좌이체로 정산합니다.",
      "시세가 분명한 인기 모델, 상태가 좋은 상품에 잘 맞습니다.",
    ],
  },
  {
    title: "위탁 판매",
    summary: "촬영부터 판매, 고객 응대까지 레미츄가 대행합니다.",
    points: [
      "상품을 맡기시면 검수, 촬영, 상세페이지 제작, 판매를 대신 진행합니다.",
      "판매가 완료된 뒤 수수료를 제외한 금액을 정산합니다.",
      "즉시 매입보다 높은 판매가를 기대할 수 있습니다.",
      "급하게 현금화하지 않고 제값에 팔고 싶을 때 적합합니다.",
    ],
  },
];

const processSteps = [
  {
    step: "01",
    title: "사진·정보 보내기",
    description: "상품 전체, 모서리, 하자 부위, 구성품 사진을 카카오톡으로 보내주세요. 브랜드, 모델명, 구매 시기, 사용감을 함께 적어주시면 더 정확합니다.",
  },
  {
    step: "02",
    title: "매입 여부·예상가 안내",
    description: "사진을 검토한 뒤 즉시 매입과 위탁 판매 중 어떤 방식이 맞는지, 예상 금액을 안내합니다. 이 단계에서는 비용이 없습니다.",
  },
  {
    step: "03",
    title: "상품 전달·검수",
    description: "방문 접수 또는 택배로 상품을 보내주시면 정품 여부와 상태를 검수합니다. 최종 금액은 실물 확인 후 확정됩니다.",
  },
  {
    step: "04",
    title: "판매·정산",
    description: "즉시 매입은 검수 당일 정산합니다. 위탁 판매는 판매 완료 후 정산합니다.",
  },
];

const faqItems = [
  {
    q: "어떤 상품을 판매할 수 있나요?",
    a: "가방, 지갑, 클러치 등 중고명품을 주로 매입·위탁합니다. 브랜드, 모델, 상태에 따라 접수 가능 여부가 달라질 수 있으니 사진과 함께 먼저 문의해 주세요.",
  },
  {
    q: "시세는 어떻게 정해지나요?",
    a: "최근 거래가, 상태 등급, 구성품 유무, 시즌 수요를 보고 예상가를 안내합니다. 최종 금액은 실물 검수 후 확정됩니다.",
  },
  {
    q: "당일 현금 정산이 가능한가요?",
    a: "즉시 매입으로 진행하면 검수 완료 당일 계좌이체로 정산합니다. 위탁 판매는 실제 판매가 끝난 뒤 정산됩니다.",
  },
  {
    q: "즉시 매입과 위탁 판매 중 어떤 게 나은가요?",
    a: "빠르게 정산받고 싶다면 즉시 매입이 맞습니다. 조금 더 기다리더라도 높은 판매가를 원하시면 위탁 판매가 맞습니다. 상담 때 두 방식의 예상 금액을 비교해 드립니다.",
  },
  {
    q: "구성품이 없어도 판매할 수 있나요?",
    a: "가능합니다. 더스트백, 박스, 영수증이 있으면 금액에 도움이 되지만, 없어도 상품 상태만 좋으면 접수할 수 있습니다.",
  },
  {
    q: "가품이면 어떻게 되나요?",
    a: "레미츄는 정품만 취급합니다. 검수에서 가품으로 확인되면 매입·위탁을 진행하지 않으며, 상품은 돌려드립니다.",
  },
  {
    q: "상품은 어떻게 보내면 되나요?",
    a: "방문 접수 또는 택배로 보내실 수 있습니다. 상담 후 주소와 포장 방법을 안내해 드립니다.",
  },
  {
    q: "상담할 때 무엇을 준비하면 되나요?",
    a: "상품 앞뒤·옆면 사진, 하자 부위 확대 사진, 구성품 사진, 브랜드와 모델명, 사용 기간을 준비해 주세요. 아래 카카오톡 문의하기를 누르면 상담을 시작할 수 있습니다.",
  },
];

const prepItems = [
  "상품 전체 사진 (앞, 뒤, 옆, 바닥)",
  "모서리·가죽·하드웨어 등 하자 부위 확대 사진",
  "더스트백, 박스, 스트랩, 영수증 등 구성품 사진",
  "브랜드, 모델명, 색상, 대략적인 구매 시기",
];

export default function SellPage() {
  return (
    <CustomerPageShell className="bg-background font-sans">
      <section className="border-b border-border pb-10 md:pb-14">
        <p className="text-[13px] font-semibold text-[#8B8B8B] dark:text-muted-foreground">
          중고명품 매입 · 위탁
        </p>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-foreground md:text-[40px]">
          내 명품 판매하기
        </h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-7 text-[#8B8B8B] dark:text-muted-foreground md:text-[16px]">
          바로 채팅하지 않아도 됩니다. 판매 방식과 자주 묻는 내용을 먼저 확인한 뒤,
          아래에서 카카오톡으로 사진과 함께 문의해 주세요.
        </p>
      </section>

      <section className="border-b border-border py-10 md:py-14">
        <h2 className="text-[22px] font-bold tracking-tight text-foreground md:text-[28px]">
          판매 방식
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
          급하게 정산받을지, 제값에 맡길지에 따라 고르시면 됩니다.
        </p>
        <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2">
          {saleMethods.map((method) => (
            <article
              key={method.title}
              className="rounded-md border border-[#EEEEEE] px-5 py-6 dark:border-border md:px-6 md:py-7"
            >
              <h3 className="text-[17px] font-bold tracking-tight text-foreground md:text-[18px]">
                {method.title}
              </h3>
              <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
                {method.summary}
              </p>
              <ul className="mt-5 space-y-2 text-[14px] leading-6 text-foreground">
                {method.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="shrink-0">-</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-b border-border py-10 md:py-14">
        <h2 className="text-[22px] font-bold tracking-tight text-foreground md:text-[28px]">
          진행 절차
        </h2>
        <ol className="mt-6 divide-y divide-[#EEEEEE] border-y border-[#EEEEEE] dark:divide-border dark:border-border md:mt-8">
          {processSteps.map((item) => (
            <li key={item.step} className="grid gap-2 py-5 md:grid-cols-[72px_minmax(0,1fr)] md:gap-6">
              <span className="text-[13px] font-semibold text-[#8B8B8B] dark:text-muted-foreground">
                {item.step}
              </span>
              <div>
                <p className="text-[16px] font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-b border-border py-10 md:py-14">
        <h2 className="text-[22px] font-bold tracking-tight text-foreground md:text-[28px]">
          자주 묻는 질문
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
          상담 전에 확인할 수 있는 내용을 모았습니다.
        </p>
        <div className="mt-6 border-t border-[#EEEEEE] dark:border-border">
          {faqItems.map((item) => (
            <details key={item.q} className="group border-b border-[#EEEEEE] dark:border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-left text-[14px] font-medium text-foreground md:py-4 md:text-[15px] [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-[#8B8B8B] transition-transform duration-200 group-open:rotate-180 dark:text-muted-foreground" />
              </summary>
              <p className="pb-4 pr-8 text-[13px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[14px]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-b border-border py-10 md:py-14">
        <h2 className="text-[22px] font-bold tracking-tight text-foreground md:text-[28px]">
          문의 전 준비하면 좋은 것
        </h2>
        <ul className="mt-5 space-y-2 text-[14px] leading-6 text-foreground">
          {prepItems.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="shrink-0">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="py-10 md:py-14">
        <h2 className="text-[22px] font-bold tracking-tight text-foreground md:text-[28px]">
          확인하셨다면 상담을 남겨 주세요
        </h2>
        <p className="mt-2 max-w-xl text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground">
          사진과 상품 정보를 보내주시면 매입 가능 여부와 진행 방식을 안내해 드립니다.
        </p>
        <KakaoCsLink
          message={buildSellInquiryMessage()}
          className="mt-6 inline-flex h-14 w-full items-center justify-center rounded-md bg-[#FEE500] px-6 text-[15px] font-semibold text-[#191919] transition-opacity hover:opacity-90 sm:w-auto"
        >
          카카오톡 문의하기
        </KakaoCsLink>
      </section>
    </CustomerPageShell>
  );
}
