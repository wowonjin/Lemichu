import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { ORDER_STATUS_LABELS } from "@/lib/orderStatus";
import type { OrderStatus } from "@/lib/orders";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function normalizePhone(value: string) {
  let phone = digitsOnly(value);
  if (phone.startsWith("82") && phone.length >= 12) {
    phone = `0${phone.slice(2)}`;
  }
  return phone;
}

function isGuestOrder(data: Record<string, unknown>) {
  return data.isGuest === true || data.source === "web-guest-bank-transfer";
}

function orderPhone(data: Record<string, unknown>) {
  const delivery =
    data.delivery && typeof data.delivery === "object"
      ? (data.delivery as Record<string, unknown>)
      : {};
  const logii =
    delivery.logii && typeof delivery.logii === "object"
      ? (delivery.logii as Record<string, unknown>)
      : {};
  return [delivery.phone, logii.recipientPhone, data.userPhone]
    .map((value) => normalizePhone(asString(value)))
    .find((phone) => phone.length >= 10);
}

function parseLookupQuery(raw: unknown) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    return { error: "전화번호 또는 이메일을 입력해 주세요." };
  }

  if (value.includes("@")) {
    const email = value.toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      return { error: "이메일을 올바르게 입력해 주세요." };
    }
    return { email };
  }

  const phone = normalizePhone(value);
  if (phone.length < 10 || phone.length > 11) {
    return { error: "휴대전화는 숫자 10~11자리로 입력해 주세요." };
  }
  return { phone };
}

function createdAtMs(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value) {
    return Number((value as { toMillis: () => number }).toMillis()) || 0;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

async function loadGuestOrderDocs() {
  const db = getAdminDb();
  const [byFlag, bySource] = await Promise.all([
    db.collection("orders").where("isGuest", "==", true).get(),
    db.collection("orders").where("source", "==", "web-guest-bank-transfer").get(),
  ]);

  const docs = new Map<string, (typeof byFlag.docs)[number]>();
  for (const snapshot of [byFlag, bySource]) {
    for (const doc of snapshot.docs) {
      docs.set(doc.id, doc);
    }
  }
  return [...docs.values()];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { query?: unknown } | null;
    const parsed = parseLookupQuery(body?.query);
    if ("error" in parsed) {
      return NextResponse.json({ ok: false, message: parsed.error }, { status: 400 });
    }

    const docs = await loadGuestOrderDocs();
    const orders = docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        if (!isGuestOrder(data)) return null;

        const email = asString(data.userEmail).trim().toLowerCase();
        const phone = orderPhone(data);
        const matches = parsed.email
          ? email === parsed.email
          : Boolean(phone && phone === parsed.phone);
        if (!matches) return null;

        const items = Array.isArray(data.items) ? data.items : [];
        const first = items[0] as { brand?: string; name?: string } | undefined;
        const productName =
          [first?.brand, first?.name].filter(Boolean).join(" ").trim() || "주문 상품";
        const extraCount = Math.max(items.length - 1, 0);
        const status = (asString(data.status) || "pending") as OrderStatus;
        const delivery =
          data.delivery && typeof data.delivery === "object"
            ? (data.delivery as Record<string, unknown>)
            : {};

        return {
          orderId: doc.id,
          orderNo: asString(data.orderNo) || doc.id,
          productName: extraCount > 0 ? `${productName} 외 ${extraCount}건` : productName,
          status,
          statusLabel: ORDER_STATUS_LABELS[status] ?? status,
          courier: asString(delivery.courier),
          invoiceNo: asString(delivery.invoiceNo),
          _createdAtMs: createdAtMs(data.createdAt),
        };
      })
      .filter((order): order is NonNullable<typeof order> => Boolean(order))
      .sort((a, b) => b._createdAtMs - a._createdAtMs)
      .slice(0, 20)
      .map(({ _createdAtMs, ...order }) => order);

    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error("[orders/guest/lookup] failed", error);
    return NextResponse.json(
      { ok: false, message: "주문을 조회하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
