"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { Button } from "@/components/ui/button";
import { getFirebaseIdToken } from "@/lib/auth";

function TossSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("결제 승인 처리 중입니다.");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey") || "";
    const orderId = searchParams.get("orderId") || "";
    const amount = Number(searchParams.get("amount"));

    if (!paymentKey || !orderId || !Number.isInteger(amount) || amount <= 0) {
      setHasError(true);
      setMessage("결제 승인 정보를 찾을 수 없어요.");
      return;
    }

    let cancelled = false;

    async function confirmPayment() {
      try {
        const token = await getFirebaseIdToken();
        if (!token) {
          throw new Error("로그인 정보를 확인할 수 없어요. 다시 로그인한 뒤 주문 내역을 확인해주세요.");
        }

        const response = await fetch("/api/payments/toss/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });
        const json = await response.json().catch(() => ({}));

        if (!response.ok || !json?.ok) {
          throw new Error(json?.message || "결제 승인에 실패했어요.");
        }

        if (!cancelled) {
          setMessage("결제가 완료되었어요. 주문 내역으로 이동합니다.");
          window.setTimeout(() => {
            router.replace(json.redirectTo || "/my/orders");
          }, 600);
        }
      } catch (error) {
        if (!cancelled) {
          setHasError(true);
          setMessage(error instanceof Error ? error.message : "결제 승인 중 문제가 발생했어요.");
        }
      }
    }

    confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <CustomerPageShell className="bg-background font-sans">
      <section className="mx-auto grid min-h-[420px] max-w-xl place-items-center text-center">
        <div className="w-full border border-border p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Toss Payments
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">
            결제 승인
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
          {hasError ? (
            <div className="mt-6 flex justify-center gap-2">
              <Button asChild variant="outline">
                <Link href="/my">마이페이지</Link>
              </Button>
              <Button asChild>
                <Link href="/my/orders">주문 내역</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </CustomerPageShell>
  );
}

export default function TossSuccessPage() {
  return (
    <Suspense
      fallback={
        <CustomerPageShell className="bg-background font-sans">
          <section className="mx-auto grid min-h-[420px] max-w-xl place-items-center text-center">
            <p className="text-sm font-medium text-muted-foreground">
              결제 승인 처리 중입니다.
            </p>
          </section>
        </CustomerPageShell>
      }
    >
      <TossSuccessContent />
    </Suspense>
  );
}
