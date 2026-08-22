"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CustomerPageShell } from "@/components/layout/CustomerPage";
import { Button } from "@/components/ui/button";

function TossFailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  return (
    <CustomerPageShell className="bg-background font-sans">
      <section className="mx-auto grid min-h-[420px] max-w-xl place-items-center text-center">
        <div className="w-full border border-border p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Toss Payments
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">
            결제가 완료되지 않았어요
          </h1>
          <div className="mt-3 space-y-1 text-sm leading-6 text-muted-foreground">
            {message ? <p>{message}</p> : <p>결제가 취소되었거나 실패했습니다.</p>}
            {code ? <p>오류 코드: {code}</p> : null}
            {orderId ? <p>주문번호: {orderId}</p> : null}
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/cart">장바구니</Link>
            </Button>
            <Button asChild>
              <Link href="/new-arrivals">쇼핑 계속하기</Link>
            </Button>
          </div>
        </div>
      </section>
    </CustomerPageShell>
  );
}

export default function TossFailPage() {
  return (
    <Suspense
      fallback={
        <CustomerPageShell className="bg-background font-sans">
          <section className="mx-auto grid min-h-[420px] max-w-xl place-items-center text-center">
            <p className="text-sm font-medium text-muted-foreground">
              결제 결과를 확인하는 중입니다.
            </p>
          </section>
        </CustomerPageShell>
      }
    >
      <TossFailContent />
    </Suspense>
  );
}
