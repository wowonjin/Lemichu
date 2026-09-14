"use client";

import { getFirebaseIdToken } from "@/lib/auth";
import type { CheckoutDeliveryInput } from "@/lib/bank-transfer-order";
import type { CheckoutItemInput } from "@/lib/checkout";
import type { TossCheckoutMethod } from "@/lib/points";

type TossPaymentRequest = {
  method: TossCheckoutMethod;
  amount: {
    currency: "KRW";
    value: number;
  };
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerEmail?: string;
  customerName?: string;
  transfer?: {
    cashReceipt: {
      type: "소득공제" | "지출증빙";
    };
    useEscrow: boolean;
  };
};

type TossPayment = {
  requestPayment: (request: TossPaymentRequest) => Promise<void>;
};

type TossPaymentWindow = {
  on: (
    event: "paymentRequest",
    handler: (payload: { paymentMethod?: unknown }) => void | Promise<void>
  ) => void;
};

type TossWidgets = {
  setAmount: (amount: { currency: "KRW"; value: number }) => Promise<void>;
  renderPaymentWindow: (options: {
    variantKey: { paymentMethod: string; agreement: string };
  }) => Promise<TossPaymentWindow>;
  requestPayment: (request: {
    orderId: string;
    orderName: string;
    successUrl?: string;
    failUrl?: string;
    customerEmail?: string;
    customerName?: string;
  }) => Promise<void>;
};

type TossPaymentsInstance = {
  payment: (options: { customerKey: string }) => TossPayment;
  widgets: (options: { customerKey: string }) => TossWidgets;
};

type TossPaymentsFactory = (clientKey: string) => TossPaymentsInstance;

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

const TOSS_SCRIPT_ID = "toss-payments-v2-standard";
const TOSS_SCRIPT_SRC = "https://js.tosspayments.com/v2/standard";

function isWidgetClientKey(clientKey: string) {
  const lower = clientKey.toLowerCase();
  return (
    lower.includes("_gck_") ||
    lower.startsWith("test_gck_") ||
    lower.startsWith("live_gck_")
  );
}

function loadTossPaymentsV2(): Promise<TossPaymentsFactory> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 결제를 시작할 수 있어요."));
  }

  if (window.TossPayments) {
    return Promise.resolve(window.TossPayments);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TOSS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.TossPayments) resolve(window.TossPayments);
        else reject(new Error("토스페이먼츠 SDK를 불러오지 못했어요."));
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("토스페이먼츠 SDK를 불러오지 못했어요."));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = TOSS_SCRIPT_ID;
    script.src = TOSS_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.TossPayments) resolve(window.TossPayments);
      else reject(new Error("토스페이먼츠 SDK를 불러오지 못했어요."));
    };
    script.onerror = () => {
      reject(new Error("토스페이먼츠 SDK를 불러오지 못했어요."));
    };
    document.head.appendChild(script);
  });
}

export async function requestTossPayment(
  items: CheckoutItemInput[],
  method: TossCheckoutMethod = "CARD",
  options?: { usePoints?: boolean; delivery?: CheckoutDeliveryInput }
) {
  const token = await getFirebaseIdToken();
  if (!token) {
    throw new Error("토스 결제는 Firebase 로그인 후 이용할 수 있어요.");
  }

  const response = await fetch("/api/payments/toss/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      items,
      method,
      usePoints: Boolean(options?.usePoints),
      delivery: options?.delivery,
    }),
  });
  const json = await response.json().catch(() => ({}));

  if (!response.ok || !json?.ok) {
    throw new Error(json?.message || "결제 주문을 생성하지 못했어요.");
  }

  if (json.alreadyPaid) {
    window.location.assign("/my/orders");
    return;
  }

  const clientKey = String(json.paymentClientKey);
  const TossPayments = await loadTossPaymentsV2();
  const tossPayments = TossPayments(clientKey);
  const customerEmail = json.customerEmail;
  const customerName = json.customerName;

  if (isWidgetClientKey(clientKey)) {
    const widgets = tossPayments.widgets({ customerKey: String(json.customerKey) });
    await widgets.setAmount({
      currency: "KRW",
      value: Number(json.order.amount),
    });
    const paymentWindow = await widgets.renderPaymentWindow({
      variantKey: {
        paymentMethod: "DEFAULT",
        agreement: "AGREEMENT",
      },
    });
    paymentWindow.on("paymentRequest", async () => {
      try {
        await widgets.requestPayment({
          orderId: String(json.order.orderId),
          orderName: String(json.order.orderName),
          successUrl: String(json.order.successUrl),
          failUrl: String(json.order.failUrl),
          customerEmail,
          customerName,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("취소")) return;
        throw error;
      }
    });
    return;
  }

  const payment = tossPayments.payment({ customerKey: String(json.customerKey) });
  const checkoutMethod: TossCheckoutMethod = method === "TRANSFER" ? "TRANSFER" : "CARD";

  await payment.requestPayment({
    method: checkoutMethod,
    amount: {
      currency: "KRW",
      value: Number(json.order.amount),
    },
    orderId: String(json.order.orderId),
    orderName: String(json.order.orderName),
    successUrl: String(json.order.successUrl),
    failUrl: String(json.order.failUrl),
    customerEmail,
    customerName,
    ...(checkoutMethod === "TRANSFER"
      ? {
          transfer: {
            cashReceipt: { type: "소득공제" },
            useEscrow: false,
          },
        }
      : {}),
  });
}
