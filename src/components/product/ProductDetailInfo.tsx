import { cn } from "@/lib/cn";
import {
  getProductDetailSpecRows,
  getProductSizeGuideRows,
  parseProductDetailContent,
} from "@/lib/productDetailContent";
import type { ProductOption } from "@/lib/productOptions";
import type { Product } from "@/types/product";

export function ProductDetailInfo({
  product,
  sizeGuide,
}: {
  product: Product;
  sizeGuide: ProductOption[];
}) {
  const parsed = parseProductDetailContent(product.detailContent);
  const specRows = getProductDetailSpecRows(product, parsed);
  const sizeGuideRows = getProductSizeGuideRows(sizeGuide, parsed);
  const fallbackCopy = product.isPreOwned
    ? `${product.condition ?? "A"} 등급으로 검수 완료된 중고명품입니다. 주문 전 색상, 사이즈, 구성품을 확인해 주세요.`
    : "정식 유통처를 통해 입고된 신상품입니다. 주문 전 색상, 사이즈, 구성품을 확인해 주세요.";

  return (
    <div className="mt-7 space-y-3 md:mt-8 md:space-y-4">
      <article className="rounded-md bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7">
        {parsed.summary.length > 0 ? (
          <div className="space-y-2 text-[14px] leading-6 text-[#6B6B6B] dark:text-muted-foreground">
            {parsed.summary.map((sentence) => (
              <p key={sentence}>{sentence}</p>
            ))}
          </div>
        ) : !product.detailContent && !parsed.isRichHtml ? (
          <p className="text-[14px] leading-6 text-[#6B6B6B] dark:text-muted-foreground">
            {fallbackCopy}
          </p>
        ) : null}

        <h3
          className={cn(
            "text-[16px] font-bold tracking-tight text-foreground md:text-[17px]",
            parsed.summary.length > 0 || (!product.detailContent && !parsed.isRichHtml)
              ? "mt-6"
              : ""
          )}
        >
          상품 상세
        </h3>
        <SpecList rows={specRows} />
      </article>

      {parsed.features.length > 0 ? (
        <article className="rounded-md bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7">
          <h3 className="text-[16px] font-bold tracking-tight text-foreground md:text-[17px]">
            주요 특징
          </h3>
          <ul className="mt-4 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
            {parsed.features.map((feature) => (
              <li
                key={feature}
                className="flex gap-2.5 text-[13px] leading-6 text-foreground"
              >
                <span className="mt-[9px] size-1 shrink-0 rounded-full bg-[#C4C4C4] dark:bg-muted-foreground" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {sizeGuideRows.length > 0 ? (
        <article className="rounded-md bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7">
          <h3 className="text-[16px] font-bold tracking-tight text-foreground md:text-[17px]">
            사이즈 안내
          </h3>
          <SpecList rows={sizeGuideRows} emphasizeLabel />
        </article>
      ) : null}

      {parsed.isRichHtml && product.detailContent ? (
        <article className="rounded-md bg-[#F7F7F7] px-6 py-6 dark:bg-muted md:px-7 md:py-7">
          <div
            className="space-y-3 text-[14px] leading-6 text-[#6B6B6B] dark:text-muted-foreground [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:text-foreground [&_img]:w-full [&_li]:ml-4 [&_li]:list-disc [&_table]:w-full [&_td]:border-b [&_td]:border-[#EBEBEB] [&_td]:py-2 [&_th]:border-b [&_th]:border-[#EBEBEB] [&_th]:py-2 [&_th]:text-left"
            dangerouslySetInnerHTML={{ __html: product.detailContent }}
          />
        </article>
      ) : null}
    </div>
  );
}

function SpecList({
  rows,
  emphasizeLabel = false,
}: {
  rows: Array<{ label: string; value: string }>;
  emphasizeLabel?: boolean;
}) {
  return (
    <dl className="mt-4 divide-y divide-[#EBEBEB] dark:divide-border">
      {rows.map((row) => (
        <div
          key={`${row.label}-${row.value}`}
          className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 py-3 text-[13px] sm:grid-cols-[120px_minmax(0,1fr)]"
        >
          <dt
            className={
              emphasizeLabel
                ? "font-semibold text-foreground"
                : "text-[#8B8B8B] dark:text-muted-foreground"
            }
          >
            {row.label}
          </dt>
          <dd className="font-medium leading-6 text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
