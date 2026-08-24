import type { OrderStatus, PurchaseOrder } from "@/lib/orders";

export type LogiiDeliveryRow = {
  rowNumber: number;
  bookedAt: string;
  service: string;
  reservationNo: string;
  invoiceNo: string;
  parcelSize: string;
  itemName: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
};

export type LogiiImportRowStatus =
  | "linked"
  | "unchanged"
  | "ambiguous"
  | "unmatched";

export type LogiiImportResultRow = LogiiDeliveryRow & {
  status: LogiiImportRowStatus;
  message: string;
  orderId?: string;
  orderNo?: string;
  userId?: string;
  customerName?: string;
  score?: number;
  matchedBy?: string[];
};

export type LogiiImportReport = {
  ok: true;
  fileName: string;
  summary: {
    total: number;
    linked: number;
    unchanged: number;
    ambiguous: number;
    unmatched: number;
    withInvoice: number;
  };
  rows: LogiiImportResultRow[];
};

export type LogiiShipmentRecord = LogiiDeliveryRow & {
  id: string;
  sourceFileName: string;
  matchStatus: "matched" | "ambiguous" | "unmatched";
  orderId?: string;
  orderNo?: string;
  userId?: string;
  customerName?: string;
  importedAt?: string | null;
};

export type MatchableMember = {
  id: string;
  name?: string;
  phone?: string;
  addresses?: Array<{
    name?: string;
    phone?: string;
    address1?: string;
    address2?: string;
  }>;
};

export type MatchableOrder = Pick<
  PurchaseOrder,
  | "id"
  | "orderNo"
  | "userId"
  | "userName"
  | "status"
  | "items"
  | "delivery"
  | "createdAt"
>;

export type LogiiOrderMatch = {
  row: LogiiDeliveryRow;
  order?: MatchableOrder;
  status: "matched" | "ambiguous" | "unmatched";
  score?: number;
  matchedBy?: string[];
  message: string;
};

type ScoredOrder = {
  order: MatchableOrder;
  score: number;
  matchedBy: string[];
  identitySignals: number;
  hasName: boolean;
  hasProduct: boolean;
  hasDate: boolean;
  existingReservation: boolean;
};

const MATCHABLE_ORDER_STATUSES = new Set<OrderStatus>([
  "paid",
  "preparing",
  "shipping",
  "delivered",
]);

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]/g, "");
}

function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function maskedPhoneMatches(maskedPhone: string, candidatePhone: string) {
  const maskedDigits = normalizePhone(maskedPhone);
  const candidateDigits = normalizePhone(candidatePhone);
  if (!maskedDigits || !candidateDigits) return 0;

  if (!maskedPhone.includes("*")) {
    return maskedDigits === candidateDigits ? 1 : 0;
  }

  if (!candidateDigits.startsWith(maskedDigits)) return 0;
  if (maskedDigits.length >= 7) return 1;
  if (maskedDigits.length >= 5) return 0.75;
  return 0;
}

function bigrams(value: string) {
  const result: string[] = [];
  for (let index = 0; index < value.length - 1; index += 1) {
    result.push(value.slice(index, index + 2));
  }
  return result;
}

function diceSimilarity(left: string, right: string) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) {
    const shorter = Math.min(left.length, right.length);
    const longer = Math.max(left.length, right.length);
    return shorter >= 6 ? Math.max(0.82, shorter / longer) : shorter / longer;
  }

  const leftPairs = bigrams(left);
  const rightPairs = bigrams(right);
  if (!leftPairs.length || !rightPairs.length) return 0;

  const remaining = new Map<string, number>();
  rightPairs.forEach((pair) => remaining.set(pair, (remaining.get(pair) ?? 0) + 1));
  let overlap = 0;
  leftPairs.forEach((pair) => {
    const count = remaining.get(pair) ?? 0;
    if (count > 0) {
      overlap += 1;
      remaining.set(pair, count - 1);
    }
  });
  return (2 * overlap) / (leftPairs.length + rightPairs.length);
}

function toDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const converter = (value as { toDate?: unknown }).toDate;
    if (typeof converter === "function") {
      const converted = converter.call(value);
      return converted instanceof Date ? converted : null;
    }
  }
  return null;
}

function parseBookedDate(value: string) {
  const match = value.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function dayDifference(order: MatchableOrder, bookedAt: string) {
  const orderDate = toDate(order.createdAt);
  const bookedDate = parseBookedDate(bookedAt);
  if (!orderDate || !bookedDate) return null;
  const orderDay = new Date(
    orderDate.getFullYear(),
    orderDate.getMonth(),
    orderDate.getDate()
  ).getTime();
  return Math.round((bookedDate.getTime() - orderDay) / 86_400_000);
}

function uniqueNormalized(values: Array<unknown>) {
  return [...new Set(values.map(normalizeText).filter(Boolean))];
}

function memberForOrder(
  order: MatchableOrder,
  members: Map<string, MatchableMember>
) {
  return members.get(order.userId);
}

function scoreOrder(
  row: LogiiDeliveryRow,
  order: MatchableOrder,
  members: Map<string, MatchableMember>
): ScoredOrder {
  const member = memberForOrder(order, members);
  const addresses = member?.addresses ?? [];
  const logii = order.delivery?.logii;
  const existingReservation =
    Boolean(row.reservationNo) &&
    normalizeText(logii?.reservationNo) === normalizeText(row.reservationNo);

  if (existingReservation) {
    return {
      order,
      score: 1_000,
      matchedBy: ["기존 예약번호"],
      identitySignals: 3,
      hasName: true,
      hasProduct: true,
      hasDate: true,
      existingReservation: true,
    };
  }

  let score = 0;
  let identitySignals = 0;
  let hasName = false;
  let hasProduct = false;
  let hasDate = false;
  const matchedBy: string[] = [];

  const rowName = normalizeText(row.recipientName);
  const names = uniqueNormalized([
    order.delivery?.recipientName,
    order.userName,
    member?.name,
    ...addresses.map((address) => address.name),
  ]);
  if (rowName && names.includes(rowName)) {
    score += 38;
    identitySignals += 1;
    hasName = true;
    matchedBy.push("받는 분");
  }

  const phoneStrength = Math.max(
    0,
    ...[
      order.delivery?.phone,
      member?.phone,
      ...addresses.map((address) => address.phone),
    ].map((phone) => maskedPhoneMatches(row.recipientPhone, String(phone ?? "")))
  );
  if (phoneStrength > 0) {
    score += Math.round(36 * phoneStrength);
    identitySignals += 1;
    matchedBy.push("연락처");
  }

  const rowAddress = normalizeText(row.recipientAddress);
  const addressSimilarity = Math.max(
    0,
    ...[
      [order.delivery?.address1, order.delivery?.address2].filter(Boolean).join(" "),
      ...addresses.map((address) =>
        [address.address1, address.address2].filter(Boolean).join(" ")
      ),
    ].map((address) => diceSimilarity(rowAddress, normalizeText(address)))
  );
  if (addressSimilarity >= 0.82) {
    score += 34;
    identitySignals += 1;
    matchedBy.push("주소");
  } else if (addressSimilarity >= 0.62) {
    score += 24;
    identitySignals += 1;
    matchedBy.push("주소 유사");
  }

  const rowItem = normalizeText(row.itemName);
  const itemSimilarity = Math.max(
    0,
    ...order.items.flatMap((item) => {
      const name = normalizeText(item.name);
      const fullName = normalizeText(`${item.brand} ${item.name}`);
      return [diceSimilarity(rowItem, name), diceSimilarity(rowItem, fullName)];
    })
  );
  if (itemSimilarity >= 0.82) {
    score += 18;
    hasProduct = true;
    matchedBy.push("상품");
  } else if (itemSimilarity >= 0.62) {
    score += 11;
    hasProduct = true;
    matchedBy.push("상품 유사");
  }

  const difference = dayDifference(order, row.bookedAt);
  if (difference !== null) {
    if (difference < -1) {
      score -= 30;
    } else if (difference <= 3) {
      score += 12;
      hasDate = true;
      matchedBy.push("주문일");
    } else if (difference <= 14) {
      score += 9;
      hasDate = true;
      matchedBy.push("주문일");
    } else if (difference <= 45) {
      score += 5;
      hasDate = true;
      matchedBy.push("주문일 범위");
    } else if (difference > 120) {
      score -= 15;
    }
  }

  return {
    order,
    score,
    matchedBy,
    identitySignals,
    hasName,
    hasProduct,
    hasDate,
    existingReservation: false,
  };
}

function isEligibleMatch(candidate: ScoredOrder) {
  if (candidate.existingReservation) return true;
  if (candidate.identitySignals >= 2 && candidate.score >= 60) return true;
  return (
    candidate.hasName &&
    candidate.hasProduct &&
    candidate.hasDate &&
    candidate.score >= 62
  );
}

function priority(row: LogiiDeliveryRow, orders: MatchableOrder[]) {
  const existingReservation = orders.some(
    (order) =>
      row.reservationNo &&
      normalizeText(order.delivery?.logii?.reservationNo) ===
        normalizeText(row.reservationNo)
  );
  return (existingReservation ? 10_000 : 0) + (row.invoiceNo ? 1_000 : 0);
}

export function matchLogiiRowsToOrders(
  rows: LogiiDeliveryRow[],
  orders: MatchableOrder[],
  memberList: MatchableMember[]
) {
  const members = new Map(memberList.map((member) => [member.id, member]));
  const candidates = orders.filter((order) =>
    MATCHABLE_ORDER_STATUSES.has(order.status)
  );
  const usedOrderIds = new Set<string>();
  const decisions = new Map<number, LogiiOrderMatch>();
  const prioritizedRows = [...rows].sort(
    (left, right) =>
      priority(right, candidates) - priority(left, candidates) ||
      left.rowNumber - right.rowNumber
  );

  for (const row of prioritizedRows) {
    if (!row.reservationNo || !row.recipientName) {
      decisions.set(row.rowNumber, {
        row,
        status: "unmatched",
        message: "예약번호 또는 받는 분 이름이 비어 있습니다.",
      });
      continue;
    }

    const scored = candidates
      .filter(
        (order) =>
          !usedOrderIds.has(order.id) ||
          normalizeText(order.delivery?.logii?.reservationNo) ===
            normalizeText(row.reservationNo)
      )
      .map((order) => scoreOrder(row, order, members))
      .sort((left, right) => right.score - left.score);
    const best = scored[0];
    const runnerUp = scored[1];

    if (!best || !isEligibleMatch(best)) {
      decisions.set(row.rowNumber, {
        row,
        status: "unmatched",
        score: best?.score,
        matchedBy: best?.matchedBy,
        message: "일치 신호가 충분한 주문을 찾지 못했습니다.",
      });
      continue;
    }

    const scoreGap = best.score - (runnerUp?.score ?? 0);
    if (
      !best.existingReservation &&
      runnerUp &&
      isEligibleMatch(runnerUp) &&
      scoreGap < 12
    ) {
      decisions.set(row.rowNumber, {
        row,
        status: "ambiguous",
        score: best.score,
        matchedBy: best.matchedBy,
        message: "조건이 비슷한 주문이 여러 건이라 자동 연동하지 않았습니다.",
      });
      continue;
    }

    usedOrderIds.add(best.order.id);
    decisions.set(row.rowNumber, {
      row,
      order: best.order,
      status: "matched",
      score: best.score,
      matchedBy: best.matchedBy,
      message: `${best.matchedBy.join(" · ")} 기준으로 주문을 찾았습니다.`,
    });
  }

  return rows.map(
    (row) =>
      decisions.get(row.rowNumber) ?? {
        row,
        status: "unmatched" as const,
        message: "주문을 찾지 못했습니다.",
      }
  );
}
