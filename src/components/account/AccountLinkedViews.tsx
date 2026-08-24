"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useAccountResource } from "@/hooks/useAccountResource";
import {
  createMyReturnRequest,
  createMySellRequest,
  fetchMyCoupons,
  fetchMyNotifications,
  fetchMyProfile,
  fetchMyReturnRequests,
  fetchMySellRequests,
  fetchPublishedFaqs,
  markMyNotificationsRead,
  saveMyProfile,
} from "@/lib/member-account-client";
import {
  GRADE_BENEFITS,
  GRADE_LABELS,
  NOTIFICATION_KIND_LABELS,
  RETURN_TYPE_LABELS,
  RETURN_TYPES,
  SELL_DASHBOARD_STEPS,
  SELL_KIND_LABELS,
  SELL_STATUS_LABELS,
  countSellByStatus,
  formatCouponValue,
  formatMemberDate,
  groupFaqs,
  isCouponUsable,
  resolveMemberGrade,
  type ReturnType,
  type SellKind,
  type MemberFaq,
  type SellRequest,
} from "@/lib/member-account";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettingKey,
} from "@/lib/accountStorage";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { getCancelledOrders } from "@/lib/orderStatus";
import { AuthGate } from "./AuthGate";
import {
  AccountCtaLink,
  AccountEmptyState,
  AccountErrorState,
  AccountSection,
  AccountSkeleton,
  AccountStatRow,
} from "./AccountPageShell";
import { OrderCard } from "./OrderCard";
import { KakaoCsLink } from "./KakaoCsLink";

const inputClass = "h-12 rounded-2xl border border-border bg-background px-4 text-sm font-normal";

function SellForm({
  kind,
  onCreated,
}: {
  kind: SellKind;
  onCreated: () => void | Promise<void>;
}) {
  const [brand, setBrand] = useState("");
  const [itemName, setItemName] = useState("");
  const [condition, setCondition] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!brand.trim() || !itemName.trim() || !condition.trim() || submitting) return;
    setSubmitting(true);
    setFormError("");
    try {
      await createMySellRequest({
        kind,
        brand: brand.trim(),
        itemName: itemName.trim(),
        condition: condition.trim(),
        note: note.trim() || undefined,
      });
      setBrand("");
      setItemName("");
      setCondition("");
      setNote("");
      await onCreated();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "판매 신청을 등록하지 못했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccountSection title="판매 신청">
      <form onSubmit={submit} className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            placeholder="브랜드"
            maxLength={80}
            className={inputClass}
          />
          <input
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            placeholder="상품명"
            maxLength={120}
            className={inputClass}
          />
        </div>
        <input
          value={condition}
          onChange={(event) => setCondition(event.target.value)}
          placeholder="상품 상태 (예: 미사용, 사용감 있음)"
          maxLength={80}
          className={inputClass}
        />
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="추가로 전달할 내용을 입력해주세요."
          maxLength={1000}
          className="min-h-28 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-normal"
        />
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <button
          type="submit"
          disabled={submitting || !brand.trim() || !itemName.trim() || !condition.trim()}
          className="h-12 rounded-2xl bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-50"
        >
          {submitting ? "등록 중..." : "신청 등록"}
        </button>
      </form>
    </AccountSection>
  );
}

function ResourceState({
  status,
  error,
  onRetry,
  children,
}: {
  status: "loading" | "ready" | "error";
  error: string;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  if (status === "loading") {
    return (
      <AccountSection>
        <AccountSkeleton rows={3} />
      </AccountSection>
    );
  }
  if (status === "error") {
    return (
      <AccountSection>
        <AccountErrorState message={error} onRetry={onRetry} />
      </AccountSection>
    );
  }
  return <>{children}</>;
}

export function CouponsView() {
  const loader = useCallback(() => fetchMyCoupons(), []);
  const { data: coupons, status, error, retry } = useAccountResource(loader, []);
  const usable = coupons.filter(isCouponUsable);

  return (
    <ResourceState status={status} error={error} onRetry={retry}>
      {usable.length === 0 ? (
        <AccountSection>
          <AccountEmptyState
            title="사용 가능한 쿠폰이 없어요"
            description="관리자가 쿠폰을 발급하면 여기에 표시됩니다."
            action={<AccountCtaLink href="/products">상품 둘러보기</AccountCtaLink>}
          />
        </AccountSection>
      ) : (
        <AccountSection title={`사용 가능 ${usable.length}장`}>
          <ul className="divide-y divide-border">
            {usable.map((coupon) => (
              <li key={coupon.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="text-[15px] font-semibold text-foreground">{coupon.name}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {coupon.code}
                    {coupon.minOrder > 0 ? ` · ${formatPriceWithUnit(coupon.minOrder)} 이상` : ""}
                    {coupon.expiresAt ? ` · ${formatMemberDate(coupon.expiresAt)}까지` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-[14px] font-bold">{formatCouponValue(coupon)}</p>
              </li>
            ))}
          </ul>
        </AccountSection>
      )}
    </ResourceState>
  );
}

function SellList({ items }: { items: SellRequest[] }) {
  if (items.length === 0) return null;
  return (
    <AccountSection title="진행 내역">
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15px] font-semibold">{item.brand} {item.itemName}</p>
              <span className="text-[12px] font-semibold text-muted-foreground">{SELL_STATUS_LABELS[item.status]}</span>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {SELL_KIND_LABELS[item.kind]} · {item.condition} · {formatMemberDate(item.createdAt)}
            </p>
            {item.estimatePrice != null ? (
              <p className="mt-2 text-[14px] font-semibold">예상가 {formatPriceWithUnit(item.estimatePrice)}</p>
            ) : null}
            {item.settlementAmount != null ? (
              <p className="mt-1 text-[14px] font-semibold">정산 {formatPriceWithUnit(item.settlementAmount)}</p>
            ) : null}
            {item.adminNote ? <p className="mt-2 text-[13px] text-muted-foreground">{item.adminNote}</p> : null}
          </li>
        ))}
      </ul>
    </AccountSection>
  );
}

export function SellSectionView({
  kind,
  emptyTitle,
  emptyDescription,
}: {
  kind?: SellKind | "inspection" | "settlement";
  emptyTitle: string;
  emptyDescription: string;
}) {
  const loader = useCallback(() => fetchMySellRequests(), []);
  const { data: requests, status, error, retry, reload } = useAccountResource(loader, []);
  const items = useMemo(() => {
    if (kind === "inspection") return requests.filter((item) => item.kind !== "estimate");
    if (kind === "settlement") return requests.filter((item) => item.status === "settled" || item.settlementAmount);
    if (kind) return requests.filter((item) => item.kind === kind);
    return requests;
  }, [kind, requests]);
  const counts = countSellByStatus(requests.filter((item) => item.kind !== "estimate"));
  const formKind = kind === "inspection" || kind === "settlement" || !kind ? "sell" : kind;

  return (
    <div className="space-y-3">
      <AccountSection>
        <AccountStatRow
          items={SELL_DASHBOARD_STEPS.map((step) => ({
            key: step.key,
            label: step.label,
            value: counts[step.key],
            emphasize: counts[step.key] > 0,
          }))}
        />
      </AccountSection>
      {kind !== "inspection" && kind !== "settlement" ? <SellForm kind={formKind} onCreated={reload} /> : null}
      <ResourceState status={status} error={error} onRetry={retry}>
        {items.length === 0 ? (
          <AccountSection>
            <AccountEmptyState title={emptyTitle} description={emptyDescription} action={<AccountCtaLink href="/sell">판매 안내 보기</AccountCtaLink>} />
          </AccountSection>
        ) : (
          <SellList items={items} />
        )}
      </ResourceState>
    </div>
  );
}

export function EstimateLinkedView() {
  return (
    <AuthGate description="로그인하면 시세 확인을 접수하고 관리자 안내를 받을 수 있어요.">
      <SellSectionView
        kind="estimate"
        emptyTitle="시세 확인 접수가 없어요"
        emptyDescription="브랜드와 상품을 접수하면 관리자가 예상가를 안내합니다."
      />
    </AuthGate>
  );
}

export function ReturnsLinkedView() {
  const { orders, status: orderStatus, error: orderError, retry: retryOrders } = usePurchaseOrders();
  const loader = useCallback(() => fetchMyReturnRequests(), []);
  const { data: requests, status, error, retry, reload } = useAccountResource(loader, []);
  const cancelled = getCancelledOrders(orders);
  const eligible = orders.filter((order) => !["pending", "failed", "cancelled"].includes(order.status));
  const [form, setForm] = useState({ orderId: "", type: "return" as ReturnType, reason: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  return (
    <div className="space-y-3">
      <AccountSection title="취소·교환·반품 신청">
        {eligible.length === 0 ? (
          <p className="text-[14px] text-muted-foreground">신청 가능한 주문이 없어요.</p>
        ) : (
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setFormError("");
              try {
                await createMyReturnRequest(form);
                setForm({ orderId: "", type: "return", reason: "" });
                reload();
              } catch (submitError) {
                setFormError(submitError instanceof Error ? submitError.message : "신청하지 못했어요.");
              } finally {
                setSaving(false);
              }
            }}
          >
            <select className={inputClass} value={form.orderId} onChange={(event) => setForm((current) => ({ ...current, orderId: event.target.value }))}>
              <option value="">주문 선택</option>
              {eligible.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNo ?? order.id} · {order.items[0]?.name ?? "주문"}
                </option>
              ))}
            </select>
            <select className={inputClass} value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ReturnType }))}>
              {RETURN_TYPES.map((type) => (
                <option key={type} value={type}>{RETURN_TYPE_LABELS[type]}</option>
              ))}
            </select>
            <textarea className="min-h-24 rounded-2xl border border-border bg-background px-4 py-3 text-sm" placeholder="사유" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} />
            {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
            <button type="submit" disabled={saving} className="h-12 rounded-md bg-foreground text-sm font-semibold text-background">
              신청하기
            </button>
          </form>
        )}
      </AccountSection>

      <ResourceState status={status} error={error} onRetry={retry}>
        {requests.length > 0 ? (
          <AccountSection title="신청 처리 현황">
            <ul className="divide-y divide-border">
              {requests.map((item) => (
                <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-[15px] font-semibold">{RETURN_TYPE_LABELS[item.type]} · {item.status === "requested" ? "접수" : item.status === "approved" ? "승인" : item.status === "rejected" ? "거절" : "완료"}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">{item.reason} · 주문 {item.orderId}</p>
                  {item.adminNote ? <p className="mt-2 text-[13px] text-muted-foreground">{item.adminNote}</p> : null}
                </li>
              ))}
            </ul>
          </AccountSection>
        ) : null}
      </ResourceState>

      {orderStatus === "loading" ? <AccountSection><AccountSkeleton rows={2} /></AccountSection> : null}
      {orderStatus === "error" ? <AccountSection><AccountErrorState message={orderError} onRetry={retryOrders} /></AccountSection> : null}
      {cancelled.length > 0 ? (
        <AccountSection className="divide-y divide-border px-0 py-0 md:px-0 md:py-0" title="취소된 주문">
          {cancelled.map((order) => (
            <div key={order.id} className="px-5 md:px-6">
              <OrderCard order={order} />
            </div>
          ))}
        </AccountSection>
      ) : null}
    </div>
  );
}

export function NotificationsLinkedView() {
  const notifLoader = useCallback(() => fetchMyNotifications(), []);
  const profileLoader = useCallback(() => fetchMyProfile(), []);
  const notifications = useAccountResource(notifLoader, []);
  const profile = useAccountResource(profileLoader, {});
  const [settings, setSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);

  useEffect(() => {
    if (profile.data.notificationSettings) {
      setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...profile.data.notificationSettings });
    }
  }, [profile.data.notificationSettings]);

  const rows: Array<{ key: NotificationSettingKey; label: string }> = [
    { key: "order", label: "주문/배송 알림" },
    { key: "event", label: "할인/이벤트 알림" },
    { key: "price", label: "관심 상품 가격 변동 알림" },
    { key: "magazine", label: "매거진 콘텐츠 알림" },
  ];

  return (
    <div className="space-y-3">
      <ResourceState status={notifications.status} error={notifications.error} onRetry={notifications.retry}>
        <AccountSection title="받은 알림" action={
          notifications.data.length > 0 ? (
            <button type="button" className="text-[13px] font-semibold text-muted-foreground" onClick={async () => {
              await markMyNotificationsRead();
              notifications.reload();
            }}>
              모두 읽음
            </button>
          ) : undefined
        }>
          {notifications.data.length === 0 ? (
            <p className="py-4 text-center text-[14px] text-muted-foreground">아직 확인할 알림이 없어요.</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.data.map((item) => (
                <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <Link href={item.href || "/my"} className="block" onClick={() => markMyNotificationsRead([item.id])}>
                    <p className="text-[15px] font-semibold">
                      {!item.read ? <span className="mr-2 text-[11px] font-bold text-gold">NEW</span> : null}
                      {item.title}
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">{item.body}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">{NOTIFICATION_KIND_LABELS[item.kind]} · {formatMemberDate(item.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AccountSection>
      </ResourceState>

      <AccountSection title="알림 설정">
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between py-4">
              <span className="text-[15px] font-medium">{row.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={settings[row.key]}
                onClick={async () => {
                  const next = { ...settings, [row.key]: !settings[row.key] };
                  setSettings(next);
                  await saveMyProfile({ notificationSettings: next });
                }}
                className={`flex h-8 w-12 items-center rounded-md px-1 transition-colors ${settings[row.key] ? "justify-end bg-foreground" : "justify-start bg-border"}`}
              >
                <span className="size-6 rounded-md bg-background shadow-sm" />
              </button>
            </div>
          ))}
        </div>
      </AccountSection>
    </div>
  );
}

export function GradeView() {
  const loader = useCallback(() => fetchMyProfile(), []);
  const { data, status, error, retry } = useAccountResource(loader, {});
  const grade = resolveMemberGrade(data.grade);

  return (
    <ResourceState status={status} error={error} onRetry={retry}>
      <AccountSection>
        <p className="text-[13px] font-medium text-muted-foreground">현재 등급</p>
        <p className="mt-2 text-[32px] font-bold tracking-tight">{GRADE_LABELS[grade]}</p>
        <ul className="mt-5 space-y-2">
          {GRADE_BENEFITS[grade].map((item) => (
            <li key={item} className="text-[14px] leading-6 text-muted-foreground">{item}</li>
          ))}
        </ul>
      </AccountSection>
    </ResourceState>
  );
}

export function FaqLinkedView() {
  const [groups, setGroups] = useState<Array<{ category: string; items: MemberFaq[] }>>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublishedFaqs()
      .then((items) => setGroups(groupFaqs(items)))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "FAQ를 불러오지 못했어요."));
  }, []);

  if (error) {
    return (
      <AccountSection>
        <AccountErrorState message={error} />
      </AccountSection>
    );
  }

  if (groups.length === 0) {
    return (
      <AccountSection>
        <AccountSkeleton rows={4} />
      </AccountSection>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <AccountSection key={group.category} title={group.category}>
          <div className="divide-y divide-border">
            {group.items.map((item) => (
              <details key={item.id} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="pb-4 text-[14px] leading-7 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </AccountSection>
      ))}
      <AccountSection>
        <p className="text-[15px] font-semibold text-foreground">카카오톡 고객센터</p>
        <p className="mt-1.5 text-[14px] leading-6 text-muted-foreground">
          주문·배송·상품 문의는 카카오톡으로 남겨 주세요. 상담원이 확인 후 답변드립니다.
        </p>
        <KakaoCsLink className="mt-4 inline-flex h-11 items-center text-sm font-semibold text-foreground">
          카카오톡으로 문의하기
        </KakaoCsLink>
      </AccountSection>
    </div>
  );
}

export function useSellDashboardStats() {
  const loader = useCallback(() => fetchMySellRequests(), []);
  return useAccountResource(loader, []);
}

export function useMyNotificationInbox() {
  const loader = useCallback(() => fetchMyNotifications(), []);
  return useAccountResource(loader, []);
}
