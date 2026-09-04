"use client";

import { Check } from "lucide-react";
import { TossCheckoutSheet } from "@/components/product/TossCheckoutSheet";
import { formatPriceWithUnit } from "@/lib/formatPrice";

export function CheckoutPaymentCompleteDialog({
  open,
  orderId,
  amount,
  onGoToDelivery,
  isGuest = false,
}: {
  open: boolean;
  orderId: string;
  amount: number;
  onGoToDelivery: () => void;
  isGuest?: boolean;
}) {
  return (
    <TossCheckoutSheet
      open={open}
      onClose={onGoToDelivery}
      labelledBy="checkout-payment-complete-title"
    >
      <div className="flex flex-col items-center px-6 pb-7 pt-10 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-[#3182F6] text-white shadow-[0_8px_20px_rgba(49,130,246,0.28)]">
          <Check className="size-8" strokeWidth={2.8} />
        </span>

        <h2
          id="checkout-payment-complete-title"
          className="mt-6 text-[24px] font-bold leading-8 tracking-[-0.04em] text-[#191F28]"
        >
          주문이 접수되었어요
        </h2>
        {amount > 0 ? (
          <p className="mt-2 text-[17px] font-semibold tabular-nums tracking-[-0.03em] text-[#191F28]">
            {formatPriceWithUnit(amount)}
          </p>
        ) : null}
        {orderId ? (
          <p className="mt-1 text-[13px] text-[#8B95A1]">주문번호 {orderId}</p>
        ) : null}

        <p className="mt-5 text-[15px] font-semibold leading-6 text-[#191F28]">
          안내된 계좌로 입금해 주세요
        </p>

        <div className="mt-4 w-full rounded-[16px] bg-[#F2F4F6] px-4 py-4 text-left">
          <p className="text-[14px] leading-6 text-[#4E5968]">
            입금이 확인되면 배송이 시작돼요.
            <br />
            {isGuest
              ? "전화번호나 이메일로 비회원 주문조회에서 주문상태, 택배사, 송장번호를 확인할 수 있어요."
              : "마이페이지에서 주문상태와 배송 정보를 확인할 수 있어요."}
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToDelivery}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-[14px] bg-[#3182F6] text-[16px] font-semibold text-white transition-colors hover:bg-[#1B64DA]"
        >
          {isGuest ? "주문 조회하기" : "배송 현황 보기"}
        </button>
      </div>
    </TossCheckoutSheet>
  );
}
