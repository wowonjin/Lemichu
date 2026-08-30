"use client";

import { useEffect, useState } from "react";
import { Copy, X } from "lucide-react";
import { TossCheckoutSheet } from "@/components/product/TossCheckoutSheet";
import { useToast } from "@/components/ui/toast";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  BANK_TRANSFER_ACCOUNT,
  formatBankAccountNumber,
} from "@/lib/bank-transfer";
import { submitBankTransferOrder } from "@/lib/bank-transfer-order";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { copyTextToClipboard } from "@/lib/kakao-inquiry";
import { publishPointsChanged } from "@/lib/points";

export function BankTransferDepositDialog({
  open,
  onClose,
  amount,
  productAmount,
  pointsToUse = 0,
  expectedEarn = 0,
  productId,
  variantId,
  usePoints = false,
  productName,
  optionLabel,
}: {
  open: boolean;
  onClose: () => void;
  amount: number;
  productAmount?: number;
  pointsToUse?: number;
  expectedEarn?: number;
  productId?: string;
  variantId?: string;
  usePoints?: boolean;
  productName: string;
  optionLabel?: string;
}) {
  const { toast } = useToast();
  const { isLoggedIn } = useAuthUser();
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [depositorName, setDepositorName] = useState("");
  const [createdOrder, setCreatedOrder] = useState<{
    orderId: string;
    payablePrice: number;
    depositDueAt?: string;
  } | null>(null);
  const formattedAccount = formatBankAccountNumber(BANK_TRANSFER_ACCOUNT.accountNumber);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setSubmitting(false);
      setDepositorName("");
      setCreatedOrder(null);
    }
  }, [open]);

  const copyAccount = () => {
    const ok = copyTextToClipboard(BANK_TRANSFER_ACCOUNT.accountNumber);
    setCopied(ok);
    toast(ok ? "계좌번호를 복사했어요." : "계좌번호를 복사하지 못했어요. 직접 입력해 주세요.");
  };

  const confirmOrder = async () => {
    if (!isLoggedIn || !productId) {
      onClose();
      return;
    }
    if (submitting) return;
    if (!depositorName.trim()) {
      toast("입금자명을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitBankTransferOrder({
        productId,
        variantId,
        usePoints,
        depositorName,
      });
      publishPointsChanged();
      toast(
        result.expectedEarn && result.expectedEarn > 0
          ? "주문이 접수되었어요. 입금이 확인되면 적립금이 지급됩니다."
          : result.pointsToUse && result.pointsToUse > 0
            ? "주문이 접수되었고 적립금이 사용 처리되었어요."
            : "주문이 접수되었어요."
      );
      if (result.orderId && typeof result.payablePrice === "number") {
        setCreatedOrder({
          orderId: result.orderId,
          payablePrice: result.payablePrice,
          depositDueAt: result.depositDueAt,
        });
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "주문을 접수하지 못했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TossCheckoutSheet open={open} onClose={onClose} labelledBy="bank-transfer-title">
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

      <div className="px-5 pb-3 pt-1">
        <h2
          id="bank-transfer-title"
          className="text-[22px] font-bold leading-8 tracking-[-0.03em]"
        >
          {BANK_TRANSFER_ACCOUNT.methodLabel}
        </h2>
        <p className="mt-1 text-[14px] leading-5 text-[#8B95A1]">
          {createdOrder
            ? "주문 금액과 입금자명을 정확히 맞춰 입금해 주세요."
            : "입금자명을 입력하고 주문을 먼저 접수해 주세요."}
        </p>
      </div>

      <div className="px-5">
        <div className="rounded-[16px] bg-[#F2F4F6] px-5 py-5">
          <p className="text-[13px] font-medium text-[#8B95A1]">입금할 금액</p>
          <p className="mt-1 text-[28px] font-bold leading-none tracking-[-0.04em] text-[#191F28]">
            {formatPriceWithUnit(createdOrder?.payablePrice ?? amount)}
          </p>
          {pointsToUse > 0 ? (
            <p className="mt-2 text-[13px] font-medium text-[#3182F6]">
              적립금 {formatPriceWithUnit(pointsToUse)} 사용
              {productAmount != null
                ? ` · 상품 금액 ${formatPriceWithUnit(productAmount)}`
                : ""}
            </p>
          ) : null}
          {expectedEarn > 0 ? (
            <p className="mt-2 text-[13px] text-[#4E5968]">
              입금 확인 후 {formatPriceWithUnit(expectedEarn)} 적립
            </p>
          ) : null}
          <p className="mt-3 truncate text-[13px] font-medium text-[#4E5968]">{productName}</p>
          {optionLabel ? (
            <p className="mt-1 text-[13px] text-[#8B95A1]">{optionLabel}</p>
          ) : null}
        </div>

        {!createdOrder ? (
          <label className="mt-3 block rounded-[16px] border border-[#E5E8EB] px-5 py-4">
            <span className="text-[13px] font-semibold text-[#4E5968]">입금자명</span>
            <input
              value={depositorName}
              onChange={(event) => setDepositorName(event.target.value)}
              maxLength={40}
              autoComplete="name"
              placeholder="실제 송금할 계좌의 예금주명"
              className="mt-2 h-11 w-full rounded-[10px] bg-[#F2F4F6] px-3 text-[15px] font-semibold text-[#191F28] outline-none placeholder:font-normal placeholder:text-[#B0B8C1]"
            />
            <span className="mt-2 block text-[12px] leading-5 text-[#8B95A1]">
              띄어쓰기까지 동일해야 자동으로 입금 확인됩니다.
            </span>
          </label>
        ) : (
          <div className="mt-3 rounded-[16px] border border-[#E5E8EB] px-5 py-4">
            <div className="mb-4 rounded-[12px] bg-[#E8F3FF] px-4 py-3">
              <p className="text-[12px] font-medium text-[#4E5968]">주문번호</p>
              <p className="mt-1 break-all text-[15px] font-bold text-[#1B64DA]">
                {createdOrder.orderId}
              </p>
              <p className="mt-2 text-[12px] text-[#4E5968]">
                입금자명 {depositorName.trim()}
              </p>
            </div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#FFCC00] text-[12px] font-extrabold tracking-tight text-[#191F28]">
              KB
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-[-0.02em]">
                {BANK_TRANSFER_ACCOUNT.bankName}
              </p>
              <p className="text-[13px] text-[#8B95A1]">
                예금주 {BANK_TRANSFER_ACCOUNT.accountHolder}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#8B95A1]">계좌번호</p>
              <p className="mt-1 break-all text-[18px] font-bold tracking-[-0.03em] text-[#191F28] sm:text-[20px]">
                {formattedAccount}
              </p>
            </div>
            <button
              type="button"
              onClick={copyAccount}
              className="inline-flex h-9 items-center gap-1 rounded-[10px] bg-[#F2F4F6] px-3 text-[13px] font-semibold text-[#3182F6] transition-colors hover:bg-[#E8F3FF]"
            >
              <Copy className="size-3.5" />
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          </div>
        )}
      </div>

      <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
        {createdOrder ? (
          <>
            <button
              type="button"
              onClick={copyAccount}
              className="flex h-14 w-full items-center justify-center rounded-[16px] bg-[#3182F6] text-[17px] font-semibold text-white transition-colors hover:bg-[#1B64DA]"
            >
              계좌번호 복사하기
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-[16px] text-[15px] font-semibold text-[#4E5968] transition-colors hover:bg-[#F2F4F6]"
            >
              닫기
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={submitting || !depositorName.trim()}
            onClick={() => void confirmOrder()}
            className="flex h-14 w-full items-center justify-center rounded-[16px] bg-[#3182F6] text-[17px] font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
          >
            {submitting ? "주문 접수 중..." : "주문 접수하기"}
          </button>
        )}
      </div>
    </TossCheckoutSheet>
  );
}
