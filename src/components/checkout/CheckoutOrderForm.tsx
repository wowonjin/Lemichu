"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { CheckoutCollapsibleSection } from "@/components/checkout/CheckoutCollapsibleSection";
import { CheckoutPaymentCompleteDialog } from "@/components/checkout/CheckoutPaymentCompleteDialog";
import { useDaumPostcode } from "@/components/checkout/useDaumPostcode";
import { useToast } from "@/components/ui/toast";
import { useAuthUser } from "@/hooks/useAuthUser";
import { canSubmitMemberOrder, normalizePhoneNumber } from "@/lib/auth";
import {
  BANK_TRANSFER_ACCOUNT,
  formatBankAccountNumber,
} from "@/lib/bank-transfer";
import {
  submitBankTransferOrder,
  type BankTransferOrderResult,
} from "@/lib/bank-transfer-order";
import {
  clearCheckoutDraft,
  type CheckoutDraft,
  type CheckoutDraftItem,
} from "@/lib/checkout-draft";
import { cn } from "@/lib/cn";
import { formatPrice, formatPriceWithUnit } from "@/lib/formatPrice";
import { submitGuestBankTransferOrder } from "@/lib/guest-order";
import { fetchMyProfile } from "@/lib/member-account-client";
import { isRealImage } from "@/lib/placeholder";

const EMAIL_DOMAINS = [
  { value: "direct", label: "직접 입력" },
  { value: "naver.com", label: "naver.com" },
  { value: "gmail.com", label: "gmail.com" },
  { value: "daum.net", label: "daum.net" },
  { value: "hanmail.net", label: "hanmail.net" },
  { value: "nate.com", label: "nate.com" },
  { value: "kakao.com", label: "kakao.com" },
] as const;

const DELIVERY_REQUESTS = [
  { value: "", label: "-- 메시지 선택 (선택사항) --" },
  { value: "call", label: "배송 전에 미리 연락바랍니다." },
  { value: "security", label: "부재 시 경비실에 맡겨주세요." },
  { value: "door", label: "부재 시 문 앞에 놓아주세요." },
  { value: "fast", label: "빠른 배송 부탁드립니다." },
  { value: "locker", label: "택배함에 보관해 주세요." },
  { value: "custom", label: "직접 입력" },
] as const;

type PaymentMethod = "bank" | "card";

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length < 8) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function isValidGuestPassword(value: string) {
  if (value.length < 10 || value.length > 16 || /\s/.test(value)) return false;
  let kinds = 0;
  if (/[a-z]/.test(value)) kinds += 1;
  if (/[A-Z]/.test(value)) kinds += 1;
  if (/[0-9]/.test(value)) kinds += 1;
  if (/[^A-Za-z0-9]/.test(value)) kinds += 1;
  return kinds >= 2;
}

function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 block text-[13px] font-semibold text-[#4E5968]">
      {children}
      {required ? <span className="ml-0.5 text-[#F04452]">*</span> : null}
    </span>
  );
}

function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-[10px] border border-[#E5E8EB] bg-background px-3 text-[15px] text-[#191F28] outline-none transition-colors placeholder:text-[#B0B8C1] focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/20 disabled:bg-[#F2F4F6] disabled:text-[#8B95A1]",
        className
      )}
    />
  );
}

function TextSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-11 w-full appearance-none rounded-[10px] border border-[#E5E8EB] bg-background bg-[length:12px] bg-[right_12px_center] bg-no-repeat px-3 pr-9 text-[15px] text-[#191F28] outline-none transition-colors focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/20",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 fill=%22none%22%3E%3Cpath stroke=%22%238B95A1%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m1 1.5 5 5 5-5%22/%3E%3C/svg%3E')]",
        className
      )}
    >
      {children}
    </select>
  );
}

function DeliveryRequestField({
  value,
  customValue,
  onChange,
  onCustomChange,
}: {
  value: string;
  customValue: string;
  onChange: (value: string) => void;
  onCustomChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected =
    DELIVERY_REQUESTS.find((option) => option.value === value) ??
    DELIVERY_REQUESTS[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <FieldLabel>배송 요청사항</FieldLabel>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-[10px] border bg-background px-3 text-left text-[15px] outline-none transition-colors",
          open
            ? "border-[#3182F6] ring-2 ring-[#3182F6]/20"
            : "border-[#E5E8EB] hover:border-[#D1D6DB]",
          value ? "text-[#191F28]" : "text-[#8B95A1]"
        )}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#8B95A1] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="mt-1.5 max-h-64 overflow-auto rounded-[12px] border border-[#E5E8EB] bg-background py-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
        >
          {DELIVERY_REQUESTS.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value || "empty"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    if (option.value !== "custom") onCustomChange("");
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[14px] transition-colors",
                    active
                      ? "bg-[#F2F4F6] font-semibold text-[#191F28]"
                      : "text-[#4E5968] hover:bg-[#F9FAFB]"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {active ? (
                    <Check className="size-4 shrink-0 text-[#3182F6]" strokeWidth={2.5} />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {value === "custom" ? (
        <div className="mt-2">
          <TextInput
            value={customValue}
            onChange={(event) => onCustomChange(event.target.value)}
            maxLength={50}
            placeholder="배송 요청사항을 입력해 주세요"
          />
          <p className="mt-1.5 text-right text-[12px] text-[#8B95A1]">
            {customValue.length}/50
          </p>
        </div>
      ) : null}
    </div>
  );
}

function AgreementRow({
  checked,
  onChange,
  label,
  href,
  muted,
}: {
  checked: boolean;
  onChange?: () => void;
  label: string;
  href?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[10px] px-1 py-2",
        muted && "bg-[#F9FAFB] px-3 text-[#B0B8C1]"
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={muted}
        onClick={onChange}
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-[5px] border transition-colors",
          checked
            ? "border-[#3182F6] bg-[#3182F6] text-white"
            : "border-[#D1D6DB] bg-background text-transparent",
          muted && "cursor-default opacity-70"
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </button>
      {href ? (
        <Link
          href={href}
          target="_blank"
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-[13px] font-medium text-[#4E5968] hover:text-[#191F28]"
        >
          <span className="truncate">{label}</span>
          <ChevronRight className="size-4 shrink-0 text-[#D1D6DB]" />
        </Link>
      ) : (
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
          {label}
        </span>
      )}
    </div>
  );
}

function PaymentSummaryCard({
  productTotal,
  finalTotal,
  agreeAll,
  agreeTerms,
  agreePrivacy,
  onToggleAgreeAll,
  onToggleTerms,
  onTogglePrivacy,
  onSubmit,
  submitting,
  completed,
}: {
  productTotal: number;
  finalTotal: number;
  agreeAll: boolean;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  onToggleAgreeAll: () => void;
  onToggleTerms: () => void;
  onTogglePrivacy: () => void;
  onSubmit: () => void;
  submitting: boolean;
  completed: boolean;
}) {
  return (
    <aside className="rounded-[16px] border border-[#E5E8EB] bg-background p-5 shadow-sm">
      <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#191F28]">
        결제정보
      </h2>

      <dl className="mt-5 space-y-3 text-[14px]">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[#8B95A1]">구매상품</dt>
          <dd className="font-medium text-[#191F28]">
            {formatPriceWithUnit(productTotal)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[#8B95A1]">배송비</dt>
          <dd className="font-medium text-[#191F28]">
            레미츄에서 무료로 보내드려요
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#F2F4F6] pt-5">
        <p className="text-[14px] font-semibold text-[#191F28]">최종 결제 금액</p>
        <p className="text-[22px] font-bold tracking-[-0.03em] text-[#191F28]">
          {formatPriceWithUnit(finalTotal)}
        </p>
      </div>

      <button
        type="button"
        disabled={submitting || completed}
        onClick={onSubmit}
        className="mt-4 flex h-14 w-full items-center justify-center rounded-[12px] bg-[#191F28] text-[16px] font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {completed
          ? "주문 접수 완료"
          : submitting
            ? "주문 접수 중..."
            : `${formatPriceWithUnit(finalTotal)} 결제하기`}
      </button>

      <div className="mt-4 space-y-1 border-t border-[#F2F4F6] pt-4">
        <label className="flex cursor-pointer items-center gap-2 px-1 py-2">
          <input
            type="checkbox"
            checked={agreeAll}
            onChange={onToggleAgreeAll}
            className="size-4 rounded border-[#D1D6DB] accent-[#3182F6]"
          />
          <span className="text-[13px] font-medium text-[#4E5968]">
            모든 약관 동의
          </span>
        </label>
        <AgreementRow
          checked={agreeTerms}
          onChange={onToggleTerms}
          label="[필수] 쇼핑몰 이용약관 동의"
          href="/terms"
        />
        <AgreementRow
          checked={agreePrivacy}
          onChange={onTogglePrivacy}
          label="[필수] 개인정보 수집 및 이용 동의"
          href="/privacy"
        />
        <AgreementRow
          checked
          muted
          label="구매조건 확인 및 결제진행 동의"
        />
      </div>
    </aside>
  );
}

export function CheckoutOrderForm({ draft }: { draft: CheckoutDraft }) {
  const router = useRouter();
  const { toast } = useToast();
  const { openPostcode } = useDaumPostcode();
  const { user, ready: authReady } = useAuthUser();

  const [items, setItems] = useState<CheckoutDraftItem[]>(draft.items);
  const [openProducts, setOpenProducts] = useState(true);
  const [openShipping, setOpenShipping] = useState(true);
  const [openPayment, setOpenPayment] = useState(true);

  const [recipientName, setRecipientName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [phone, setPhone] = useState("");
  const [emailLocal, setEmailLocal] = useState("");
  const [emailDomain, setEmailDomain] = useState("direct");
  const [emailDomainDirect, setEmailDomainDirect] = useState("");
  const [deliveryRequest, setDeliveryRequest] = useState("");
  const [deliveryRequestCustom, setDeliveryRequestCustom] = useState("");
  const [signupWithShipping, setSignupWithShipping] = useState(false);

  const [guestPassword, setGuestPassword] = useState("");
  const [guestPasswordConfirm, setGuestPasswordConfirm] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [depositorName, setDepositorName] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] =
    useState<BankTransferOrderResult | null>(null);
  // Member checkout only when a real Firebase session can issue an ID token.
  // Local-only / temp-admin sessions fall through to guest checkout so payment works without login.
  const isMemberCheckout =
    authReady && canSubmitMemberOrder(user) && draft.mode !== "guest";

  useEffect(() => {
    if (!isMemberCheckout || !user) {
      return;
    }

    const applyEmail = (email: string) => {
      const [local = "", domain = ""] = email.trim().split("@");
      if (!local || !domain) return;
      setEmailLocal((current) => current || local);
      const knownDomain = EMAIL_DOMAINS.find(
        (option) => option.value !== "direct" && option.value === domain
      );
      if (knownDomain) {
        setEmailDomain(knownDomain.value);
      } else {
        setEmailDomain("direct");
        setEmailDomainDirect((current) => current || domain);
      }
    };

    const applyMemberData = (profile?: Awaited<ReturnType<typeof fetchMyProfile>>) => {
      const savedAddress =
        profile?.addresses?.find((address) => address.isDefault) ??
        profile?.addresses?.[0];
      const memberName = savedAddress?.name || profile?.name || user.name || "";
      const memberPhone = savedAddress?.phone || profile?.phone || user.phone || "";

      setRecipientName((current) => current || memberName);
      setDepositorName((current) => current || memberName);
      setPhone((current) => current || formatPhoneInput(memberPhone));
      setPostalCode((current) => current || savedAddress?.postalCode || "");
      setAddress1((current) => current || savedAddress?.address1 || "");
      setAddress2((current) => current || savedAddress?.address2 || "");
      applyEmail(user.email || "");
    };

    let cancelled = false;
    fetchMyProfile()
      .then((profile) => {
        if (!cancelled) applyMemberData(profile);
      })
      .catch(() => {
        if (!cancelled) applyMemberData();
      });

    return () => {
      cancelled = true;
    };
  }, [isMemberCheckout, user]);

  const amounts = useMemo(() => {
    const productTotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const shippingFee = 0;
    const pointsDiscount = Math.min(
      isMemberCheckout ? (draft.pointsToUse ?? 0) : 0,
      productTotal + shippingFee
    );
    const discountTotal = pointsDiscount;
    const finalTotal = Math.max(0, productTotal + shippingFee - discountTotal);
    return { productTotal, shippingFee, discountTotal, finalTotal };
  }, [draft.pointsToUse, isMemberCheckout, items]);

  const agreeAll = agreeTerms && agreePrivacy;

  const resolvedEmail = useMemo(() => {
    const local = emailLocal.trim();
    if (!local) return "";
    const domain =
      emailDomain === "direct" ? emailDomainDirect.trim() : emailDomain;
    if (!domain) return "";
    return `${local}@${domain}`;
  }, [emailDomain, emailDomainDirect, emailLocal]);

  const removeItem = (productId: string, variantId?: string) => {
    setItems((current) => {
      const next = current.filter(
        (item) =>
          !(item.productId === productId && item.variantId === variantId)
      );
      if (next.length === 0) {
        toast("구매상품이 비어 있어요. 상품 페이지로 이동해 주세요.");
      }
      return next;
    });
  };

  const handleSearchAddress = async () => {
    try {
      await openPostcode(({ postalCode: nextPostal, address1: nextAddress }) => {
        setPostalCode(nextPostal);
        setAddress1(nextAddress);
      });
    } catch {
      toast("주소 검색을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handleSubmit = async () => {
    if (submitting || createdOrder) return;
    if (!authReady) {
      toast("회원 정보를 확인하고 있어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (items.length === 0) {
      toast("구매할 상품이 없어요.");
      return;
    }
    if (!recipientName.trim()) {
      toast("받는사람을 입력해 주세요.");
      return;
    }
    if (!postalCode.trim() || !address1.trim()) {
      toast("주소를 입력해 주세요.");
      return;
    }
    if (!normalizePhoneNumber(phone)) {
      toast("휴대전화를 숫자 10~11자리로 입력해 주세요.");
      return;
    }
    if (!resolvedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail)) {
      toast("이메일을 올바르게 입력해 주세요.");
      return;
    }
    if (!isMemberCheckout && !isValidGuestPassword(guestPassword)) {
      toast("주문조회 비밀번호는 10~16자, 영문/숫자/특수문자 중 2가지 이상 조합이어야 해요.");
      return;
    }
    if (!isMemberCheckout && guestPassword !== guestPasswordConfirm) {
      toast("비밀번호 확인이 일치하지 않아요.");
      return;
    }
    if (paymentMethod === "bank") {
      if (!depositorName.trim()) {
        toast("입금자명을 입력해 주세요.");
        return;
      }
    }
    if (paymentMethod === "card") {
      toast("신용카드 결제는 준비 중이에요. 무통장입금을 이용해 주세요.");
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      toast("필수 약관에 동의해 주세요.");
      return;
    }

    const selectedRequest = DELIVERY_REQUESTS.find(
      (option) => option.value === deliveryRequest
    );
    const deliveryMessage =
      deliveryRequest === "custom"
        ? deliveryRequestCustom.trim()
        : deliveryRequest
          ? selectedRequest?.label || ""
          : "";
    const orderItems = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    }));
    const delivery = {
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      postalCode: postalCode.trim(),
      address1: address1.trim(),
      ...(address2.trim() ? { address2: address2.trim() } : {}),
      ...(deliveryMessage ? { message: deliveryMessage } : {}),
    };

    setSubmitting(true);
    try {
      const result = isMemberCheckout
        ? await submitBankTransferOrder({
            items: orderItems,
            usePoints: draft.usePoints === true,
            depositorName: depositorName.trim(),
            delivery,
          })
        : await submitGuestBankTransferOrder({
            items: orderItems,
            email: resolvedEmail,
            guestPassword,
            depositorName: depositorName.trim(),
            delivery,
            agreements: {
              terms: true,
              privacy: true,
              purchase: true,
            },
          });
      setCreatedOrder(result);
      clearCheckoutDraft();
    } catch (error) {
      toast(error instanceof Error ? error.message : "주문을 접수하지 못했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const shippingFeeLabel = "레미츄에서 무료로 보내드려요";
  const goToDeliveryList = () => {
    router.push(isMemberCheckout ? "/my/delivery" : "/orders/lookup");
  };

  return (
    <div className="min-w-0">
      <CheckoutPaymentCompleteDialog
        open={Boolean(createdOrder)}
        orderId={createdOrder?.orderId ?? ""}
        amount={createdOrder?.payablePrice ?? amounts.finalTotal}
        onGoToDelivery={goToDeliveryList}
        isGuest={!isMemberCheckout}
      />
      <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#191F28] md:text-[28px]">
        주문/결제
      </h1>
      {isMemberCheckout ? (
        <p className="mt-2 text-[13px] text-[#4E5968]">
          회원정보의 기본 배송지와 연락처를 불러왔어요. 결제 전 내용을 확인해 주세요.
        </p>
      ) : null}

      <div className="mt-6 grid min-w-0 gap-5 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:gap-8">
        <div className="min-w-0 space-y-4">
          <CheckoutCollapsibleSection
            title="구매상품"
            open={openProducts}
            onToggle={() => setOpenProducts((value) => !value)}
          >
            {items.length === 0 ? (
              <div className="rounded-[12px] bg-[#F9FAFB] px-4 py-8 text-center">
                <p className="text-[14px] text-[#8B95A1]">구매상품이 없습니다.</p>
                <Link
                  href="/"
                  className="mt-3 inline-flex text-[14px] font-semibold text-[#3182F6]"
                >
                  쇼핑 계속하기
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {items.map((item) => (
                  <li
                    key={`${item.productId}:${item.variantId ?? "default"}`}
                    className="flex gap-3"
                  >
                    <Link
                      href={item.href}
                      className="relative size-[72px] shrink-0 overflow-hidden rounded-[10px] bg-[#F2F4F6]"
                    >
                      {item.imageUrl && isRealImage(item.imageUrl) ? (
                        <Image
                          src={item.imageUrl}
                          alt={`${item.brand} ${item.name}`}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="72px"
                        />
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-[#191F28]">
                            {item.brand} {item.name}
                          </p>
                          {item.optionLabel ? (
                            <p className="mt-0.5 text-[13px] text-[#8B95A1]">
                              {item.optionLabel}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[13px] text-[#8B95A1]">
                            {item.quantity}개
                          </p>
                          <p className="mt-1 text-[15px] font-bold text-[#191F28]">
                            {formatPriceWithUnit(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="상품 삭제"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="grid size-8 shrink-0 place-items-center rounded-[8px] text-[#8B95A1] transition-colors hover:bg-[#F2F4F6]"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[#F9FAFB] px-3 py-3 text-[13px]">
              <span className="text-[#8B95A1]">배송비</span>
              <span className="font-medium text-[#191F28]">{shippingFeeLabel}</span>
            </div>
          </CheckoutCollapsibleSection>

          <CheckoutCollapsibleSection
            title="배송지"
            open={openShipping}
            onToggle={() => setOpenShipping((value) => !value)}
          >
            <div className="space-y-4">
              <label className="block">
                <FieldLabel required>받는사람</FieldLabel>
                <TextInput
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  maxLength={40}
                  autoComplete="name"
                  placeholder="받는사람"
                />
              </label>

              <div>
                <FieldLabel required>주소</FieldLabel>
                <div className="flex gap-2">
                  <TextInput
                    value={postalCode}
                    onChange={(event) =>
                      setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 5))
                    }
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="postal-code"
                    placeholder="우편번호"
                    className="max-w-[140px]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSearchAddress()}
                    className="h-11 shrink-0 rounded-[10px] border border-[#E5E8EB] bg-background px-4 text-[14px] font-semibold text-[#191F28] transition-colors hover:bg-[#F9FAFB]"
                  >
                    주소검색
                  </button>
                </div>
                <TextInput
                  value={address1}
                  onChange={(event) => setAddress1(event.target.value)}
                  maxLength={120}
                  autoComplete="street-address"
                  placeholder="기본주소"
                  className="mt-2"
                />
                <TextInput
                  value={address2}
                  onChange={(event) => setAddress2(event.target.value)}
                  maxLength={80}
                  autoComplete="address-line2"
                  placeholder="나머지 주소 (선택 입력 가능)"
                  className="mt-2"
                />
              </div>

              <label className="block">
                <FieldLabel required>휴대전화</FieldLabel>
                <TextInput
                  value={phone}
                  onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
                  maxLength={13}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="010-1234-5678"
                />
              </label>

              <div>
                <FieldLabel required>이메일</FieldLabel>
                <div className="grid grid-cols-[1fr_auto_minmax(0,1fr)] items-center gap-2">
                  <TextInput
                    value={emailLocal}
                    onChange={(event) => setEmailLocal(event.target.value)}
                    autoComplete="username"
                    placeholder="이메일"
                  />
                  <span className="text-[14px] text-[#8B95A1]">@</span>
                  {emailDomain === "direct" ? (
                    <TextInput
                      value={emailDomainDirect}
                      onChange={(event) => setEmailDomainDirect(event.target.value)}
                      placeholder="직접 입력"
                      autoComplete="off"
                    />
                  ) : (
                    <TextInput value={emailDomain} readOnly className="bg-[#F9FAFB]" />
                  )}
                </div>
                <TextSelect
                  value={emailDomain}
                  onChange={(event) => setEmailDomain(event.target.value)}
                  className="mt-2"
                  aria-label="이메일 도메인 선택"
                >
                  {EMAIL_DOMAINS.map((domain) => (
                    <option key={domain.value} value={domain.value}>
                      {domain.label}
                    </option>
                  ))}
                </TextSelect>
              </div>

              <DeliveryRequestField
                value={deliveryRequest}
                customValue={deliveryRequestCustom}
                onChange={setDeliveryRequest}
                onCustomChange={setDeliveryRequestCustom}
              />

              {!isMemberCheckout ? (
                <div className="rounded-[12px] border border-[#F2F4F6] bg-[#F9FAFB] px-4 py-4">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={signupWithShipping}
                      onChange={(event) => setSignupWithShipping(event.target.checked)}
                      className="mt-0.5 size-4 rounded border-[#D1D6DB] accent-[#3182F6]"
                    />
                    <span className="text-[14px] font-semibold text-[#191F28]">
                      배송지 정보로 간편 회원가입
                    </span>
                  </label>
                  <ul className="mt-2 space-y-1 pl-6 text-[12px] leading-5 text-[#8B95A1]">
                    <li>
                      · 이메일, 아이디, 비밀번호만으로 간편하게 회원가입이 가능합니다.
                    </li>
                    <li>· 회원가입 후 쿠폰, 이벤트 등 할인혜택을 받으실 수 있습니다.</li>
                  </ul>
                </div>
              ) : null}
            </div>
          </CheckoutCollapsibleSection>

          {!isMemberCheckout ? (
            <section className="overflow-hidden rounded-[16px] border border-[#E5E8EB] bg-background shadow-sm">
              <div className="px-4 py-4 md:px-5">
                <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#191F28]">
                  비회원 주문조회 비밀번호
                </h2>
              </div>
              <div className="space-y-4 border-t border-[#F2F4F6] px-4 pb-5 pt-4 md:px-5">
                <label className="block">
                  <FieldLabel>비밀번호</FieldLabel>
                  <TextInput
                    type="password"
                    value={guestPassword}
                    onChange={(event) => setGuestPassword(event.target.value)}
                    maxLength={16}
                    autoComplete="new-password"
                    placeholder="비밀번호"
                  />
                  <span className="mt-1.5 block text-[12px] leading-5 text-[#8B95A1]">
                    주문 조회는 전화번호 또는 이메일로 할 수 있어요.
                    (영문대소문자/숫자/특수문자 중 2가지 이상 조합, 10자~16자)
                  </span>
                </label>
                <label className="block">
                  <FieldLabel>비밀번호 확인</FieldLabel>
                  <TextInput
                    type="password"
                    value={guestPasswordConfirm}
                    onChange={(event) => setGuestPasswordConfirm(event.target.value)}
                    maxLength={16}
                    autoComplete="new-password"
                    placeholder="비밀번호 확인"
                  />
                </label>
              </div>
            </section>
          ) : null}

          <CheckoutCollapsibleSection
            title="결제수단"
            open={openPayment}
            onToggle={() => setOpenPayment((value) => !value)}
          >
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-2.5 py-1">
                <input
                  type="radio"
                  name="payment-method"
                  checked={paymentMethod === "bank"}
                  onChange={() => setPaymentMethod("bank")}
                  className="size-4 accent-[#3182F6]"
                />
                <span className="text-[15px] font-semibold text-[#191F28]">
                  무통장입금
                </span>
              </label>

              {paymentMethod === "bank" ? (
                <div className="space-y-4 rounded-[12px] border border-[#E5E8EB] bg-[#F9FAFB] px-4 py-4">
                  <div>
                    <FieldLabel>입금계좌</FieldLabel>
                    <div className="mt-2 rounded-[10px] border border-[#E5E8EB] bg-background px-4 py-3">
                      <p className="text-[15px] font-semibold text-[#191F28]">
                        {BANK_TRANSFER_ACCOUNT.bankName}{" "}
                        {formatBankAccountNumber(
                          BANK_TRANSFER_ACCOUNT.accountNumber
                        )}
                      </p>
                      <p className="mt-1 text-[13px] text-[#8B95A1]">
                        예금주 {BANK_TRANSFER_ACCOUNT.accountHolder}
                      </p>
                    </div>
                  </div>
                  <label className="block">
                    <FieldLabel required>입금자명</FieldLabel>
                    <TextInput
                      value={depositorName}
                      onChange={(event) => setDepositorName(event.target.value)}
                      maxLength={40}
                      autoComplete="name"
                      placeholder="입금자명"
                    />
                  </label>
                </div>
              ) : null}

              <div className="flex cursor-not-allowed items-center gap-2.5 py-1 opacity-50">
                <input
                  type="radio"
                  name="payment-method"
                  checked={false}
                  disabled
                  className="size-4 accent-[#3182F6]"
                />
                <span className="text-[15px] font-semibold text-[#8B95A1]">
                  신용카드
                </span>
                <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#8B95A1]">
                  준비중
                </span>
              </div>
            </div>
          </CheckoutCollapsibleSection>

          <div className="lg:hidden">
            <PaymentSummaryCard
              productTotal={amounts.productTotal}
              finalTotal={amounts.finalTotal}
              agreeAll={agreeAll}
              agreeTerms={agreeTerms}
              agreePrivacy={agreePrivacy}
              onToggleAgreeAll={() => {
                const next = !agreeAll;
                setAgreeTerms(next);
                setAgreePrivacy(next);
              }}
              onToggleTerms={() => setAgreeTerms((value) => !value)}
              onTogglePrivacy={() => setAgreePrivacy((value) => !value)}
              onSubmit={() => void handleSubmit()}
              submitting={submitting}
              completed={Boolean(createdOrder)}
            />
          </div>
        </div>

        <div className="relative hidden min-w-0 lg:block">
          <div className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
            <PaymentSummaryCard
              productTotal={amounts.productTotal}
              finalTotal={amounts.finalTotal}
              agreeAll={agreeAll}
              agreeTerms={agreeTerms}
              agreePrivacy={agreePrivacy}
              onToggleAgreeAll={() => {
                const next = !agreeAll;
                setAgreeTerms(next);
                setAgreePrivacy(next);
              }}
              onToggleTerms={() => setAgreeTerms((value) => !value)}
              onTogglePrivacy={() => setAgreePrivacy((value) => !value)}
              onSubmit={() => void handleSubmit()}
              submitting={submitting}
              completed={Boolean(createdOrder)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
