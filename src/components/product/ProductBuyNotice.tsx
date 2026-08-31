import type { ReactNode } from "react";

export function ProductBuyNotice() {
  return (
    <section className="bg-background py-10 md:py-14">
      <div className="max-w-[720px]">
        <h2 className="text-[24px] font-bold leading-[1.3] tracking-tight text-foreground md:text-[34px]">
          구매 전, 이것만은 꼭 확인하세요!
        </h2>
        <p className="mt-3 text-[14px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[15px]">
          고객님의 안전한 쇼핑을 위해 아래 사항을 꼭 확인해 주세요.
        </p>

        <div className="mt-10 space-y-9 text-[14px] leading-7 text-foreground md:mt-12 md:text-[15px]">
          <NoticeBlock title="배송 안내">
            <NoticeList
              items={[
                "판매하는 모든 제품은 무료배송입니다.",
                "고객님께서 주문하신 상품은 입금 확인후 배송해 드립니다.",
              ]}
            />
          </NoticeBlock>

          <NoticeBlock title="교환 및 반품 안내">
            <NoticeSubBlock title="교환 및 반품이 가능한 경우">
              <NoticeList
                items={[
                  "상품을 공급 받으신 날로부터 24시간이내 레미츄 사무실로 반품접수를 해주셔야 합니다.",
                  "새상품 포장을 개봉하였거나 구성품이 훼손되어 상품가치가 상실된 경우에는 교환/반품이 불가능합니다.",
                ]}
              />
            </NoticeSubBlock>

            <NoticeSubBlock title="교환 및 반품이 불가능한 경우">
              <NoticeList
                items={[
                  "고객님의 책임 있는 사유로 상품등이 멸실 또는 훼손된 경우 (단, 포장 훼손 제외)",
                  "포장을 개봉하였거나 구성품이 훼손되어 상품가치가 상실된 경우",
                  "고객님의 사용 또는 일부 소비에 의하여 가치가 현저히 감소한 경우",
                  "시간의 경과에 의하여 재판매가 곤란할 정도로 가치가 감소한 경우",
                ]}
              />
              <p className="mt-3 text-[13px] leading-6 text-[#8B8B8B] dark:text-muted-foreground md:text-[14px]">
                (자세한 내용은 카카오톡 친구추가 레미츄 럭셔리 상담을 이용해 주시기 바랍니다.)
              </p>
            </NoticeSubBlock>

            <NoticeSubBlock title="교환 및 반품 비용">
              <NoticeList items={["구매자 단순 변심 반품 시 왕복 택배비는 구매자 부담으로, 상품 금액만 환불 됩니다."]} />
            </NoticeSubBlock>

            <NoticeSubBlock title="교환 및 반품 주소">
              <NoticeList items={["서울시 중랑구 상봉로 23길 11, 804호"]} />
            </NoticeSubBlock>
          </NoticeBlock>
        </div>
      </div>
    </section>
  );
}

function NoticeBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[18px] font-bold tracking-tight text-foreground md:text-[22px]">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function NoticeSubBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 first:mt-0">
      <h4 className="font-bold text-foreground">{title}</h4>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function NoticeList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="shrink-0">-</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
