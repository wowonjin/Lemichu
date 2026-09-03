"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckoutOrderForm } from "@/components/checkout/CheckoutOrderForm";
import {
  readCheckoutDraft,
  type CheckoutDraft,
} from "@/lib/checkout-draft";

export function CheckoutPageClient() {
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDraft(readCheckoutDraft());
    setReady(true);
  }, []);

  return (
    <div className="min-w-0 bg-[#F5F6F8] pb-[calc(var(--mobile-bottom-nav-offset)+1.5rem)] md:pb-16">
      <div className="container min-w-0 py-5 md:py-12">
        {!ready ? (
          <div className="rounded-[16px] border border-[#E5E8EB] bg-background px-5 py-16 text-center shadow-sm">
            <p className="text-[14px] text-[#8B95A1]">주문 정보를 불러오는 중...</p>
          </div>
        ) : draft ? (
          <CheckoutOrderForm draft={draft} />
        ) : (
          <div className="rounded-[16px] border border-[#E5E8EB] bg-background px-5 py-16 text-center shadow-sm">
            <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#191F28]">
              주문/결제
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-[#8B95A1]">
              결제할 상품 정보가 없어요.
              <br />
              상품 상세에서 구매하기를 눌러 비회원 결제를 시작해 주세요.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-[12px] bg-[#191F28] px-6 text-[15px] font-semibold text-white"
            >
              쇼핑 계속하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
