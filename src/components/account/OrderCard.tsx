import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatOrderDate, type PurchaseOrder } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/orderStatus";
import { getCourierTrackingUrl } from "@/lib/courier";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { isRealImage } from "@/lib/placeholder";
import { OrderProgress } from "./OrderProgress";
import { KakaoCsLink } from "./KakaoCsLink";
import { buildOrderInquiryMessage } from "@/lib/kakao-inquiry";

export function OrderCard({
  order,
  emphasizeArrival = false,
  className,
}: {
  order: PurchaseOrder;
  emphasizeArrival?: boolean;
  className?: string;
}) {
  const firstItem = order.items[0];
  const extraCount = Math.max(order.items.length - 1, 0);
  const trackingUrl = getCourierTrackingUrl(order.delivery?.courier, order.delivery?.invoiceNo);
  const logiiDelivery = order.delivery?.logii;
  const hasDeliveryInfo = Boolean(
    order.delivery?.courier ||
      order.delivery?.invoiceNo ||
      logiiDelivery?.reservationNo
  );
  const expectedArrival = firstItem?.expectedArrival;

  return (
    <article className={cn("grid gap-5 py-6 md:grid-cols-[88px_minmax(0,1fr)]", className)}>
      <div className="relative size-[88px] overflow-hidden rounded-md bg-background">
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
        {(order.amounts.pointsUsed ?? 0) > 0 ? (
          <p className="mt-1 text-xs text-[#3182F6]">
            적립금 {formatPriceWithUnit(order.amounts.pointsUsed ?? 0)} 사용
          </p>
        ) : null}
        {order.payment?.method ? (
          <p className="mt-1 text-xs text-muted-foreground">
            결제 {order.payment.method}
            {order.reward?.granted && !order.reward.reversed && order.reward.points > 0
              ? ` · 적립금 ${formatPriceWithUnit(order.reward.points)}`
              : ""}
          </p>
        ) : null}

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

        {hasDeliveryInfo ? (
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {logiiDelivery?.service ? (
              <p>택배 서비스 {logiiDelivery.service}</p>
            ) : order.delivery?.courier ? (
              <p>택배사 {order.delivery.courier}</p>
            ) : null}
            {logiiDelivery?.reservationNo ? (
              <p>
                {logiiDelivery.bookedAt ? `예약일 ${logiiDelivery.bookedAt} · ` : ""}
                예약번호 {logiiDelivery.reservationNo}
              </p>
            ) : null}
            {logiiDelivery?.recipientName ? (
              <p>
                받는 분 {logiiDelivery.recipientName}
                {logiiDelivery.recipientPhone
                  ? ` · ${logiiDelivery.recipientPhone}`
                  : ""}
              </p>
            ) : null}
            {logiiDelivery?.recipientAddress ? (
              <p>배송지 {logiiDelivery.recipientAddress}</p>
            ) : null}
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
              <p>택배 예약이 접수되었으며 송장번호는 아직 발급되지 않았어요.</p>
            )}
          </div>
        ) : order.status === "shipping" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            송장번호가 아직 등록되지 않았어요.
          </p>
        ) : null}

        <div className="mt-5">
          <OrderProgress status={order.status} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
          <Link
            href={`/my/orders#${order.id}`}
            className="inline-flex h-10 items-center rounded-md bg-background px-4 text-foreground transition-opacity hover:opacity-80"
          >
            주문 상세 보기
          </Link>
          <Link
            href={`/my/delivery?order=${order.id}`}
            className="inline-flex h-10 items-center rounded-md bg-background px-4 text-foreground transition-opacity hover:opacity-80"
          >
            배송 조회
          </Link>
          <KakaoCsLink
            message={buildOrderInquiryMessage({
              id: order.id,
              orderNo: order.orderNo,
              itemName: firstItem ? `${firstItem.brand} ${firstItem.name}` : undefined,
            })}
            className="inline-flex h-10 items-center rounded-md px-4 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            카카오톡 문의
          </KakaoCsLink>
          {["paid", "preparing", "shipping", "delivered"].includes(order.status) ? (
            <Link
              href="/my/returns"
              className="inline-flex h-10 items-center rounded-md px-4 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              취소·교환·반품
            </Link>
          ) : null}
          {order.status === "delivered" && firstItem?.href ? (
            <Link
              href={`${firstItem.href}#reviews`}
              className="inline-flex h-10 items-center rounded-md bg-foreground px-4 text-background transition-opacity hover:opacity-80"
            >
              리뷰 작성
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
