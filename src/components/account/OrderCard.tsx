import Image from "next/image";
import Link from "next/link";
import { formatOrderDate, type PurchaseOrder } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/orderStatus";
import { getCourierTrackingUrl } from "@/lib/courier";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { isRealImage } from "@/lib/placeholder";
import { OrderProgress } from "./OrderProgress";

export function OrderCard({
  order,
  emphasizeArrival = false,
}: {
  order: PurchaseOrder;
  emphasizeArrival?: boolean;
}) {
  const firstItem = order.items[0];
  const extraCount = Math.max(order.items.length - 1, 0);
  const trackingUrl = getCourierTrackingUrl(order.delivery?.courier, order.delivery?.invoiceNo);
  const expectedArrival = firstItem?.expectedArrival;

  return (
    <article className="grid gap-5 py-6 md:grid-cols-[88px_minmax(0,1fr)]">
      <div className="relative size-[88px] overflow-hidden rounded-2xl bg-muted">
        {firstItem && isRealImage(firstItem.imageUrl) ? (
          <Image
            src={firstItem.imageUrl}
            alt={`${firstItem.brand} ${firstItem.name}`}
            fill
            sizes="88px"
            unoptimized
            className="object-contain p-2"
          />
        ) : (
          <div className="h-full w-full bg-secondary" aria-hidden />
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className="text-xs text-muted-foreground">
            주문번호 {order.orderNo ?? order.id}
          </span>
          <time className="text-xs text-muted-foreground">{formatOrderDate(order)}</time>
        </div>

        <p className="mt-2 text-sm font-semibold text-foreground">
          {firstItem?.brand ?? "LEMICHU"}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {firstItem
            ? `${firstItem.name}${extraCount > 0 ? ` 외 ${extraCount}개` : ""}`
            : "주문 상품 정보를 불러오지 못했어요."}
        </p>
        {firstItem?.option ? (
          <p className="mt-1 text-xs text-muted-foreground">
            옵션 {firstItem.option} · 수량 {firstItem.quantity}개
          </p>
        ) : null}
        <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
          {formatPriceWithUnit(order.amounts.finalTotal)}
        </p>

        {expectedArrival ? (
          <p
            className={
              emphasizeArrival
                ? "mt-3 text-lg font-semibold tracking-tight text-foreground"
                : "mt-2 text-sm font-semibold text-foreground"
            }
          >
            {expectedArrival}
          </p>
        ) : null}

        {firstItem?.deliveryBadge ? (
          <p className="mt-1 text-xs text-muted-foreground">배송 방식 {firstItem.deliveryBadge}</p>
        ) : null}

        {order.status === "shipping" ? (
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {order.delivery?.courier ? <p>택배사 {order.delivery.courier}</p> : null}
            {order.delivery?.invoiceNo ? (
              trackingUrl ? (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  송장번호 {order.delivery.invoiceNo}
                </a>
              ) : (
                <p>송장번호 {order.delivery.invoiceNo}</p>
              )
            ) : (
              <p>송장번호가 아직 등록되지 않았어요.</p>
            )}
            <p>상세 배송 이력은 아직 없어요. 등록된 송장 정보로 확인할 수 있어요.</p>
          </div>
        ) : null}

        <div className="mt-5">
          <OrderProgress status={order.status} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
          <Link
            href={`/my/orders#${order.id}`}
            className="inline-flex h-10 items-center rounded-full bg-secondary px-4 text-foreground"
          >
            주문 상세 보기
          </Link>
          <Link
            href={`/my/delivery?order=${order.id}`}
            className="inline-flex h-10 items-center rounded-full bg-secondary px-4 text-foreground"
          >
            배송 조회
          </Link>
          <Link
            href={`/my/inquiries?order=${order.id}`}
            className="inline-flex h-10 items-center rounded-full px-4 text-muted-foreground hover:bg-secondary"
          >
            문의하기
          </Link>
        </div>
      </div>
    </article>
  );
}
