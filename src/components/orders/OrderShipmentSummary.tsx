import { getCourierTrackingUrl } from "@/lib/courier";
import { cn } from "@/lib/cn";

export function OrderShipmentSummary({
  statusLabel,
  courier,
  invoiceNo,
}: {
  statusLabel: string;
  courier?: string;
  invoiceNo?: string;
}) {
  const trackingUrl = getCourierTrackingUrl(courier, invoiceNo);

  return (
    <dl className="grid gap-3 text-[14px] sm:grid-cols-3">
      <ShipmentField label="주문상태" value={statusLabel} emphasis />
      <ShipmentField
        label="택배사"
        value={courier || "배송 준비 전"}
        muted={!courier}
      />
      <ShipmentField
        label="송장번호"
        value={invoiceNo || "미발급"}
        muted={!invoiceNo}
        href={trackingUrl ?? undefined}
      />
    </dl>
  );
}

function ShipmentField({
  label,
  value,
  emphasis,
  muted,
  href,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
  href?: string;
}) {
  const className = cn(
    "mt-1 font-semibold",
    emphasis && "text-[#191F28]",
    muted && "font-medium text-[#8B95A1]",
    !emphasis && !muted && "text-[#191F28]",
    href && "underline underline-offset-4 hover:text-[#3182F6]"
  );

  return (
    <div>
      <dt className="text-[11px] font-semibold text-[#8B95A1]">{label}</dt>
      <dd className={className}>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
