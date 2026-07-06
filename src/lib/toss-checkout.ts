"use client";

import { getFirebaseIdToken } from "@/lib/auth";
import type { CheckoutItemInput } from "@/lib/checkout";

type TossPaymentRequest = {
  method: "CARD";
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
};

type TossPayment = {
  requestPayment: (request: TossPaymentRequest) => Promise<void>;
};

type TossPaymentsInstance = {
  payment: (options: { customerKey: string }) => TossPayment;
};

type TossPaymentsFactory = (clientKey: string) => TossPaymentsInstance;

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

const TOSS_SCRIPT_ID = "toss-payments-v2-standard";
const TOSS_SCRIPT_SRC = "https://js.tosspayments.com/v2/standard";

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

export async function requestTossPayment(items: CheckoutItemInput[]) {
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
    body: JSON.stringify({ items }),
  });
  const json = await response.json().catch(() => ({}));

  if (!response.ok || !json?.ok) {
    throw new Error(json?.message || "결제 주문을 생성하지 못했어요.");
  }

  const TossPayments = await loadTossPaymentsV2();
  const tossPayments = TossPayments(String(json.paymentClientKey));
  const payment = tossPayments.payment({ customerKey: String(json.customerKey) });

  await payment.requestPayment({
    method: "CARD",
    amount: {
      currency: "KRW",
      value: Number(json.order.amount),
    },
    orderId: String(json.order.orderId),
    orderName: String(json.order.orderName),
    successUrl: String(json.order.successUrl),
    failUrl: String(json.order.failUrl),
    customerEmail: json.customerEmail,
    customerName: json.customerName,
  });
}
