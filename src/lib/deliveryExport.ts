import type { PurchaseOrder } from "@/lib/orders";

const deliveryHeaders = [
  "주문번호",
  "주문일",
  "수령인",
  "수령인전화번호",
  "우편번호",
  "주소",
  "상세주소",
  "배송메시지",
  "상품명",
  "옵션",
  "수량",
  "결제금액",
  "주문상태",
  "고객이메일",
  "택배사",
  "운송장번호",
];

const statusLabels: Record<PurchaseOrder["status"], string> = {
  pending: "결제대기",
  paid: "결제완료",
  failed: "결제실패",
  preparing: "상품준비",
  shipping: "배송중",
  delivered: "배송완료",
  cancelled: "취소",
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(order: PurchaseOrder) {
  const date = order.createdAt?.toDate();
  if (!date) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function productSummary(order: PurchaseOrder) {
  const firstItem = order.items[0];
  if (!firstItem) return "주문 상품";

  const extraCount = Math.max(order.items.length - 1, 0);
  return extraCount > 0
    ? `${firstItem.brand} ${firstItem.name} 외 ${extraCount}개`
    : `${firstItem.brand} ${firstItem.name}`;
}

function toDeliveryRow(order: PurchaseOrder) {
  const delivery = order.delivery;

  return [
    order.orderNo ?? order.id,
    formatDate(order),
    delivery?.recipientName || order.userName,
    delivery?.phone ?? "",
    delivery?.postalCode ?? "",
    delivery?.address1 ?? "",
    delivery?.address2 ?? "",
    delivery?.message ?? "",
    productSummary(order),
    order.items[0]?.option ?? "",
    order.itemCount,
    order.amounts.finalTotal,
    statusLabels[order.status] ?? order.status,
    order.userEmail,
    delivery?.courier ?? "",
    delivery?.invoiceNo ?? "",
  ];
}

function buildExcelHtml(orders: PurchaseOrder[]) {
  const rows = orders.map(toDeliveryRow);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; }
    th, td { border: 1px solid #d9d9d9; padding: 6px 8px; white-space: nowrap; }
    th { background: #f3f4f6; font-weight: 700; }
    .text { mso-number-format: "\\@"; }
    .number { mso-number-format: "0"; }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>${deliveryHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>${row
            .map((value, index) => {
              const isNumber = index === 10 || index === 11;
              const className = isNumber ? "number" : "text";
              return `<td class="${className}">${escapeHtml(value)}</td>`;
            })
            .join("")}</tr>`
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`;
}

export function downloadDeliveryExcel(orders: PurchaseOrder[]) {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob(["\uFEFF", buildExcelHtml(orders)], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `lemichu-delivery-${date}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
