"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { AdminField, AdminPanel, adminInputClass } from "@/components/admin/AdminForm";
import { Button } from "@/components/ui/button";
import { fetchAdminMemberSnapshot, updateAdminMember } from "@/lib/member-account-client";
import {
  GRADE_LABELS,
  MEMBER_GRADES,
  RETURN_TYPE_LABELS,
  SELL_KIND_LABELS,
  SELL_STATUS_LABELS,
  formatCouponValue,
  formatMemberDate,
  type MemberGrade,
} from "@/lib/member-account";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { brands } from "@/data/brands";
import type { OrderDeliveryInfo } from "@/lib/orders";

type Snapshot = {
  user?: {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    provider: string;
    role: string;
    grade: MemberGrade;
    points: number;
    addresses: Array<{ id: string; name: string; phone: string; address1: string; address2: string; isDefault?: boolean }>;
    notificationSettings: Record<string, boolean>;
    followedBrandIds: string[];
  };
  orders?: Array<{
    id: string;
    orderNo?: string;
    status?: string;
    amounts?: { finalTotal?: number };
    delivery?: OrderDeliveryInfo;
  }>;
  wishlistIds?: string[];
  ledger?: Array<{ id: string; type?: string; amount?: number; reason?: string; createdAt?: string | null }>;
  coupons?: Array<{ id: string; name: string; status: string; discountType: "amount" | "percent"; discountValue: number }>;
  sellRequests?: Array<{ id: string; kind: keyof typeof SELL_KIND_LABELS; itemName: string; brand: string; status: keyof typeof SELL_STATUS_LABELS }>;
  returns?: Array<{ id: string; type: keyof typeof RETURN_TYPE_LABELS; reason: string; status: string }>;
  notifications?: Array<{ id: string; title: string; read: boolean }>;
};

export function AdminUserDetailPage({ userId }: { userId: string }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", grade: "family" as MemberGrade });

  const load = async () => {
    setError("");
    try {
      const next = (await fetchAdminMemberSnapshot(userId)) as Snapshot;
      setData(next);
      if (next.user) {
        setForm({
          name: next.user.name,
          phone: next.user.phone ?? "",
          grade: next.user.grade,
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "회원 정보를 불러오지 못했어요.");
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const user = data?.user;

  return (
    <>
      <AdminPageHeader
        title={user ? `${user.name} 회원 상세` : "회원 상세"}
        actions={
          <Link href="/admin/users" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            목록으로
          </Link>
        }
      />
      {error ? <AdminNotice message={error} /> : null}
      {!user ? <EmptyAdminState text="회원 정보를 불러오는 중입니다." /> : (
        <div className="grid gap-6">
          <AdminPanel title="계정 / 등급">
            <form
              className="grid gap-3 md:grid-cols-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setSaving(true);
                setError("");
                try {
                  await updateAdminMember(userId, form);
                  await load();
                } catch (saveError) {
                  setError(saveError instanceof Error ? saveError.message : "저장하지 못했어요.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <AdminField label="이름">
                <input className={adminInputClass} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </AdminField>
              <AdminField label="연락처">
                <input className={adminInputClass} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              </AdminField>
              <AdminField label="등급">
                <select className={adminInputClass} value={form.grade} onChange={(event) => setForm((current) => ({ ...current, grade: event.target.value as MemberGrade }))}>
                  {MEMBER_GRADES.map((grade) => (
                    <option key={grade} value={grade}>{GRADE_LABELS[grade]}</option>
                  ))}
                </select>
              </AdminField>
              <div className="flex items-end">
                <Button type="submit" disabled={saving}>마이페이지에 반영</Button>
              </div>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              {user.email} · {user.provider} · {user.role} · 적립금 {formatPriceWithUnit(user.points)}
            </p>
          </AdminPanel>

          <div className="grid gap-6 xl:grid-cols-2">
            <AdminPanel title={`주문 ${data.orders?.length ?? 0}건`} action={<Link href="/admin/orders" className="text-xs font-semibold text-muted-foreground">주문 관리</Link>}>
              {(data.orders ?? []).slice(0, 6).map((order) => (
                <div key={order.id} className="border-b border-border py-3 last:border-b-0">
                  <p className="text-sm font-semibold">
                    {order.orderNo ?? order.id} · {order.status} · {formatPriceWithUnit(order.amounts?.finalTotal ?? 0)}
                  </p>
                  {order.delivery?.logii?.reservationNo || order.delivery?.invoiceNo ? (
                    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {order.delivery.logii?.service ? (
                        <p>{order.delivery.logii.service}</p>
                      ) : order.delivery.courier ? (
                        <p>{order.delivery.courier}</p>
                      ) : null}
                      {order.delivery.logii?.reservationNo ? (
                        <p>
                          예약 {order.delivery.logii.reservationNo}
                          {order.delivery.logii.bookedAt
                            ? ` · ${order.delivery.logii.bookedAt}`
                            : ""}
                        </p>
                      ) : null}
                      {order.delivery.invoiceNo ? (
                        <p>송장 {order.delivery.invoiceNo}</p>
                      ) : (
                        <p>송장 미발급</p>
                      )}
                      {order.delivery.logii?.recipientName ? (
                        <p>
                          {order.delivery.logii.recipientName}
                          {order.delivery.logii.recipientPhone
                            ? ` · ${order.delivery.logii.recipientPhone}`
                            : ""}
                        </p>
                      ) : null}
                      {order.delivery.logii?.recipientAddress ? (
                        <p>{order.delivery.logii.recipientAddress}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
              {(data.orders ?? []).length === 0 ? <p className="text-sm text-muted-foreground">주문 없음</p> : null}
            </AdminPanel>
            <AdminPanel title={`쿠폰 ${data.coupons?.length ?? 0}장`} action={<Link href="/admin/coupons" className="text-xs font-semibold text-muted-foreground">쿠폰 관리</Link>}>
              {(data.coupons ?? []).slice(0, 6).map((coupon) => (
                <p key={coupon.id} className="py-2 text-sm">{coupon.name} · {formatCouponValue(coupon)} · {coupon.status}</p>
              ))}
              {(data.coupons ?? []).length === 0 ? <p className="text-sm text-muted-foreground">쿠폰 없음</p> : null}
            </AdminPanel>
            <AdminPanel title="적립 내역" action={<Link href="/admin/points" className="text-xs font-semibold text-muted-foreground">적립금 관리</Link>}>
              {(data.ledger ?? []).slice(0, 6).map((entry) => (
                <p key={entry.id} className="py-2 text-sm">
                  {entry.type === "spend" ? "-" : "+"}{formatPriceWithUnit(Number(entry.amount ?? 0))} · {String(entry.reason ?? "")} · {formatMemberDate(entry.createdAt)}
                </p>
              ))}
              {(data.ledger ?? []).length === 0 ? <p className="text-sm text-muted-foreground">내역 없음</p> : null}
            </AdminPanel>
            <AdminPanel title={`판매 ${data.sellRequests?.length ?? 0}건`} action={<Link href="/admin/sell" className="text-xs font-semibold text-muted-foreground">판매 관리</Link>}>
              {(data.sellRequests ?? []).slice(0, 6).map((item) => (
                <p key={item.id} className="py-2 text-sm">{SELL_KIND_LABELS[item.kind]} · {item.brand} {item.itemName} · {SELL_STATUS_LABELS[item.status]}</p>
              ))}
              {(data.sellRequests ?? []).length === 0 ? <p className="text-sm text-muted-foreground">판매 신청 없음</p> : null}
            </AdminPanel>
            <AdminPanel title={`취소·교환·반품 ${data.returns?.length ?? 0}건`}>
              {(data.returns ?? []).slice(0, 6).map((item) => (
                <p key={item.id} className="py-2 text-sm">{RETURN_TYPE_LABELS[item.type]} · {item.reason}</p>
              ))}
              {(data.returns ?? []).length === 0 ? <p className="text-sm text-muted-foreground">신청 없음</p> : null}
            </AdminPanel>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <AdminPanel title="배송지">
              {user.addresses.length === 0 ? <p className="text-sm text-muted-foreground">저장된 배송지 없음</p> : user.addresses.map((address) => (
                <p key={address.id} className="py-2 text-sm">{address.name} · {address.address1} {address.address2}</p>
              ))}
            </AdminPanel>
            <AdminPanel title="관심 브랜드 / 찜">
              <p className="text-sm text-muted-foreground">찜 {data.wishlistIds?.length ?? 0}개</p>
              <p className="mt-2 text-sm">
                {user.followedBrandIds.map((id) => brands.find((brand) => brand.id === id)?.name ?? id).join(", ") || "팔로우 브랜드 없음"}
              </p>
            </AdminPanel>
            <AdminPanel title="알림 설정">
              {Object.entries(user.notificationSettings).map(([key, value]) => (
                <p key={key} className="py-1 text-sm">{key} · {value ? "켜짐" : "꺼짐"}</p>
              ))}
              <p className="mt-3 text-xs text-muted-foreground">미확인 알림 {(data.notifications ?? []).filter((item) => !item.read).length}건</p>
            </AdminPanel>
          </div>
        </div>
      )}
    </>
  );
}
