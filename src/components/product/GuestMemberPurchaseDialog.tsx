"use client";

import { ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { TossCheckoutSheet } from "@/components/product/TossCheckoutSheet";
import { getLoginHref } from "@/lib/redirect";

function TossGuestIcon() {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#F2F4F6]">
      <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
        <path
          d="M7 9h10l-.85 10.2a1.4 1.4 0 0 1-1.4 1.3H9.25a1.4 1.4 0 0 1-1.4-1.3L7 9Z"
          stroke="#4E5968"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9.2 9V7.2a2.8 2.8 0 0 1 5.6 0V9"
          stroke="#4E5968"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function TossMemberIcon() {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#E8F3FF]">
      <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
        <circle cx="12" cy="8.2" r="3.1" stroke="#3182F6" strokeWidth="1.8" />
        <path
          d="M5.6 19.2c1.15-3.15 3.35-4.75 6.4-4.75s5.25 1.6 6.4 4.75"
          stroke="#3182F6"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function GuestMemberPurchaseDialog({
  open,
  onClose,
  onGuestPurchase,
  redirectPath,
}: {
  open: boolean;
  onClose: () => void;
  onGuestPurchase: () => void;
  redirectPath: string;
}) {
  const router = useRouter();

  return (
    <TossCheckoutSheet open={open} onClose={onClose} labelledBy="guest-member-purchase-title">
      <header className="flex items-center justify-between px-5 pb-1 pt-5">
        <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#4E5968]">결제하기</p>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-[12px] text-[#8B95A1] transition-colors hover:bg-[#F2F4F6]"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="px-5 pb-2 pt-1">
        <h2
          id="guest-member-purchase-title"
          className="text-[22px] font-bold leading-8 tracking-[-0.03em]"
        >
          어떻게 구매할까요?
        </h2>
        <p className="mt-1 text-[14px] leading-5 text-[#8B95A1]">
          비회원으로 바로 결제하거나, 로그인 후 구매할 수 있어요.
        </p>
      </div>

      <div className="flex flex-col gap-2 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={onGuestPurchase}
          className="flex w-full items-center gap-3 rounded-[16px] border border-[#E5E8EB] px-4 py-3.5 text-left transition-colors hover:bg-[#F9FAFB]"
        >
          <TossGuestIcon />
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold tracking-[-0.02em]">
              비회원 구매하기
            </span>
            <span className="mt-0.5 block text-[13px] leading-5 text-[#8B95A1]">
              로그인 없이 주문/결제 화면으로 이동해요
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-[#D1D6DB]" strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={() => router.push(getLoginHref(redirectPath))}
          className="flex w-full items-center gap-3 rounded-[16px] border border-[#E5E8EB] px-4 py-3.5 text-left transition-colors hover:bg-[#F9FAFB]"
        >
          <TossMemberIcon />
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold tracking-[-0.02em]">
              회원 구매하기
            </span>
            <span className="mt-0.5 block text-[13px] leading-5 text-[#8B95A1]">
              로그인하고 주문 내역을 남겨요
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-[#D1D6DB]" strokeWidth={2} />
        </button>
      </div>
    </TossCheckoutSheet>
  );
}
