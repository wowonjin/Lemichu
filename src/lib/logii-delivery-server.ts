import "server-only";

import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { readSheet, type SheetData } from "read-excel-file/node";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  matchLogiiRowsToOrders,
  type LogiiDeliveryRow,
  type LogiiImportReport,
  type LogiiImportResultRow,
  type LogiiShipmentRecord,
  type MatchableMember,
  type MatchableOrder,
} from "@/lib/logii-delivery";
import type { OrderDeliveryInfo } from "@/lib/orders";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ROWS = 5_000;

const REQUIRED_HEADERS = [
  "예약일",
  "택배서비스",
  "예약번호",
  "운송장번호",
  "물품명",
  "받는분성함",
  "받는분연락처",
  "받는분주소",
] as const;

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim();
}

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function cellText(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return String(value).trim();
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-가-힣]/g, "_").slice(0, 160);
}

export async function parseLogiiWorkbook(file: File) {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("로지아이 .xlsx 파일만 업로드할 수 있습니다.");
  }
  if (file.size <= 0) {
    throw new Error("엑셀 파일이 비어 있습니다.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("엑셀 파일은 10MB 이하만 업로드할 수 있습니다.");
  }

  let sheet: SheetData;
  try {
    sheet = await readSheet(Buffer.from(await file.arrayBuffer()));
  } catch {
    throw new Error(
      "엑셀 파일을 읽을 수 없습니다. 로지아이에서 내려받은 .xlsx 원본인지 확인해주세요."
    );
  }
  if (!sheet.length) {
    throw new Error("엑셀 시트에 데이터가 없습니다.");
  }

  const headerIndexes = new Map<string, number>();
  sheet[0].forEach((value, index) => {
    const header = normalizeHeader(value);
    if (header) headerIndexes.set(header, index);
  });

  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headerIndexes.has(normalizeHeader(header))
  );
  if (missingHeaders.length) {
    throw new Error(
      `로지아이 예약현황 파일 형식이 아닙니다. 누락 열: ${missingHeaders.join(", ")}`
    );
  }

  const valueAt = (row: readonly unknown[], header: string) =>
    cellText(row[headerIndexes.get(normalizeHeader(header)) ?? -1]);

  const rows = sheet
    .slice(1, MAX_ROWS + 1)
    .map((row, index): LogiiDeliveryRow => ({
      rowNumber: index + 2,
      bookedAt: valueAt(row, "예약일"),
      service: valueAt(row, "택배서비스"),
      reservationNo: valueAt(row, "예약번호"),
      invoiceNo: valueAt(row, "운송장번호"),
      parcelSize: valueAt(row, "신청규격"),
      itemName: valueAt(row, "물품명"),
      recipientName: valueAt(row, "받는분성함"),
      recipientPhone: valueAt(row, "받는분연락처"),
      recipientAddress: valueAt(row, "받는분주소"),
    }))
    .filter((row) =>
      [
        row.reservationNo,
        row.invoiceNo,
        row.itemName,
        row.recipientName,
        row.recipientPhone,
        row.recipientAddress,
      ].some(Boolean)
    );

  if (sheet.length - 1 > MAX_ROWS) {
    throw new Error(`한 번에 최대 ${MAX_ROWS.toLocaleString("ko-KR")}행까지 처리할 수 있습니다.`);
  }
  if (!rows.length) {
    throw new Error("연동할 배송 예약 행이 없습니다.");
  }

  return { fileName: safeFileName(file.name), rows };
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapMember(id: string, data: DocumentData): MatchableMember {
  const addresses = Array.isArray(data.addresses)
    ? data.addresses
        .filter(
          (address: unknown): address is Record<string, unknown> =>
            Boolean(address) && typeof address === "object"
        )
        .map((address: Record<string, unknown>) => ({
          name: asString(address.name),
          phone: asString(address.phone),
          address1: asString(address.address1),
          address2: asString(address.address2),
        }))
    : [];

  return {
    id,
    name: asString(data.name),
    phone: asString(data.phone),
    addresses,
  };
}

function courierFromService(service: string) {
  const normalized = service.toLowerCase();
  if (normalized.includes("세븐일레븐")) return "롯데택배(세븐일레븐)";
  if (normalized.includes("cu")) return "CU 편의점택배";
  return service;
}

function sameText(left: unknown, right: unknown) {
  return asString(left) === asString(right);
}

function hasDeliveryChanges(
  current: OrderDeliveryInfo,
  row: LogiiDeliveryRow,
  nextCourier: string,
  nextInvoiceNo: string
) {
  const logii = current.logii;
  return !(
    sameText(logii?.reservationNo, row.reservationNo) &&
    sameText(logii?.bookedAt, row.bookedAt) &&
    sameText(logii?.service, row.service) &&
    sameText(logii?.parcelSize, row.parcelSize) &&
    sameText(logii?.itemName, row.itemName) &&
    sameText(logii?.recipientName, row.recipientName) &&
    sameText(logii?.recipientPhone, row.recipientPhone) &&
    sameText(logii?.recipientAddress, row.recipientAddress) &&
    sameText(current.courier, nextCourier) &&
    sameText(current.invoiceNo, nextInvoiceNo)
  );
}

function toResultRow(
  row: LogiiDeliveryRow,
  input: Omit<LogiiImportResultRow, keyof LogiiDeliveryRow>
): LogiiImportResultRow {
  return { ...row, ...input };
}

function toIsoDate(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date ? date.toISOString() : null;
  }
  return value instanceof Date ? value.toISOString() : null;
}

export async function importLogiiWorkbook(file: File): Promise<LogiiImportReport> {
  const { fileName, rows } = await parseLogiiWorkbook(file);
  const db = getAdminDb();
  const [ordersSnapshot, membersSnapshot] = await Promise.all([
    db.collection("orders").get(),
    db.collection("users").get(),
  ]);

  const orders = ordersSnapshot.docs.map(
    (document) =>
      ({
        id: document.id,
        ...document.data(),
      }) as MatchableOrder
  );
  const members = membersSnapshot.docs.map((document) =>
    mapMember(document.id, document.data())
  );
  const decisions = matchLogiiRowsToOrders(rows, orders, members);
  const resultRows: LogiiImportResultRow[] = [];
  let batch = db.batch();
  let pendingWrites = 0;

  const commitPending = async () => {
    if (!pendingWrites) return;
    await batch.commit();
    batch = db.batch();
    pendingWrites = 0;
  };

  for (const decision of decisions) {
    const shipmentRef = db
      .collection("logiiShipments")
      .doc(decision.row.reservationNo);
    batch.set(
      shipmentRef,
      {
        ...decision.row,
        sourceFileName: fileName,
        matchStatus: decision.status,
        orderId: decision.order?.id ?? null,
        orderNo: decision.order?.orderNo ?? decision.order?.id ?? null,
        userId: decision.order?.userId ?? null,
        customerName: decision.order?.userName ?? null,
        importedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    pendingWrites += 1;

    if (decision.status !== "matched" || !decision.order) {
      resultRows.push(
        toResultRow(decision.row, {
          status:
            decision.status === "ambiguous" ? "ambiguous" : "unmatched",
          message:
            decision.status === "ambiguous"
              ? decision.message
              : `${decision.message} 로지아이 배송 고객으로 별도 저장했습니다.`,
          score: decision.score,
          matchedBy: decision.matchedBy,
        })
      );
      if (pendingWrites >= 400) {
        await commitPending();
      }
      continue;
    }

    const order = decision.order;
    const currentDelivery = order.delivery ?? {};
    const nextCourier =
      asString(currentDelivery.courier) || courierFromService(decision.row.service);
    const nextInvoiceNo =
      asString(decision.row.invoiceNo) || asString(currentDelivery.invoiceNo);
    const changed = hasDeliveryChanges(
      currentDelivery,
      decision.row,
      nextCourier,
      nextInvoiceNo
    );

    if (!changed) {
      resultRows.push(
        toResultRow(decision.row, {
          status: "unchanged",
          message: "이미 같은 예약·배송 정보가 연동되어 있습니다.",
          orderId: order.id,
          orderNo: order.orderNo ?? order.id,
          userId: order.userId,
          customerName: order.userName,
          score: decision.score,
          matchedBy: decision.matchedBy,
        })
      );
      if (pendingWrites >= 400) {
        await commitPending();
      }
      continue;
    }

    const nextDelivery = {
      ...currentDelivery,
      recipientName:
        asString(currentDelivery.recipientName) || decision.row.recipientName,
      phone: asString(currentDelivery.phone) || decision.row.recipientPhone,
      address1:
        asString(currentDelivery.address1) || decision.row.recipientAddress,
      courier: nextCourier,
      invoiceNo: nextInvoiceNo,
      logii: {
        reservationNo: decision.row.reservationNo,
        bookedAt: decision.row.bookedAt,
        service: decision.row.service,
        parcelSize: decision.row.parcelSize,
        itemName: decision.row.itemName,
        recipientName: decision.row.recipientName,
        recipientPhone: decision.row.recipientPhone,
        recipientAddress: decision.row.recipientAddress,
        sourceFileName: fileName,
        importedAt: FieldValue.serverTimestamp(),
      },
    };
    const shouldMarkShipping =
      Boolean(decision.row.invoiceNo) &&
      (order.status === "paid" || order.status === "preparing");
    const orderRef = db.collection("orders").doc(order.id);
    batch.update(orderRef, {
      delivery: nextDelivery,
      ...(shouldMarkShipping ? { status: "shipping" } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    pendingWrites += 1;

    if (order.userId) {
      const notificationRef = db.collection("memberNotifications").doc();
      batch.set(notificationRef, {
        userId: order.userId,
        title: decision.row.invoiceNo
          ? "배송 정보가 등록되었습니다"
          : "택배 예약이 등록되었습니다",
        body: [
          decision.row.service,
          decision.row.invoiceNo
            ? `송장 ${decision.row.invoiceNo}`
            : `예약 ${decision.row.reservationNo}`,
        ]
          .filter(Boolean)
          .join(" · "),
        href: `/my/delivery?order=${order.id}`,
        kind: "order",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
      pendingWrites += 1;
    }

    resultRows.push(
      toResultRow(decision.row, {
        status: "linked",
        message: decision.row.invoiceNo
          ? "주문과 송장 정보를 연동하고 배송중으로 반영했습니다."
          : "주문과 택배 예약 정보를 연동했습니다.",
        orderId: order.id,
        orderNo: order.orderNo ?? order.id,
        userId: order.userId,
        customerName: order.userName,
        score: decision.score,
        matchedBy: decision.matchedBy,
      })
    );

    if (pendingWrites >= 400) {
      await commitPending();
    }
  }

  await commitPending();

  const count = (status: LogiiImportResultRow["status"]) =>
    resultRows.filter((row) => row.status === status).length;
  return {
    ok: true,
    fileName,
    summary: {
      total: resultRows.length,
      linked: count("linked"),
      unchanged: count("unchanged"),
      ambiguous: count("ambiguous"),
      unmatched: count("unmatched"),
      withInvoice: resultRows.filter((row) => Boolean(row.invoiceNo)).length,
    },
    rows: resultRows.sort((left, right) => left.rowNumber - right.rowNumber),
  };
}

export async function listLogiiShipments(): Promise<LogiiShipmentRecord[]> {
  const snapshot = await getAdminDb().collection("logiiShipments").get();
  return snapshot.docs
    .map((document) => {
      const data = document.data();
      const matchStatus =
        data.matchStatus === "matched" || data.matchStatus === "ambiguous"
          ? data.matchStatus
          : "unmatched";
      return {
        id: document.id,
        rowNumber: Number(data.rowNumber) || 0,
        bookedAt: asString(data.bookedAt),
        service: asString(data.service),
        reservationNo: asString(data.reservationNo) || document.id,
        invoiceNo: asString(data.invoiceNo),
        parcelSize: asString(data.parcelSize),
        itemName: asString(data.itemName),
        recipientName: asString(data.recipientName),
        recipientPhone: asString(data.recipientPhone),
        recipientAddress: asString(data.recipientAddress),
        sourceFileName: asString(data.sourceFileName),
        matchStatus,
        orderId: asString(data.orderId) || undefined,
        orderNo: asString(data.orderNo) || undefined,
        userId: asString(data.userId) || undefined,
        customerName: asString(data.customerName) || undefined,
        importedAt: toIsoDate(data.importedAt),
      };
    })
    .sort(
      (left, right) =>
        right.bookedAt.localeCompare(left.bookedAt) ||
        right.rowNumber - left.rowNumber
    );
}
