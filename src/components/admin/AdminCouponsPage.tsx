"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { AdminField, AdminPanel, adminInputClass } from "@/components/admin/AdminForm";
import { Button } from "@/components/ui/button";
import { fetchAdminUsers, type AdminUserProfile } from "@/lib/admin";
import {
  createAdminCoupon,
  fetchAdminCoupons,
  issueAdminCoupon,
} from "@/lib/member-account-client";
import { formatCouponValue, formatMemberDate, type CouponTemplate, type UserCoupon } from "@/lib/member-account";

export function AdminCouponsPage() {
  const [templates, setTemplates] = useState<CouponTemplate[]>([]);
  const [issued, setIssued] = useState<UserCoupon[]>([]);
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    discountType: "amount" as "amount" | "percent",
    discountValue: "",
    minOrder: "",
    expiresAt: "",
  });
  const [issue, setIssue] = useState({ couponId: "", userId: "" });

  const load = async () => {
    setError("");
    try {
      const [couponData, nextUsers] = await Promise.all([fetchAdminCoupons(), fetchAdminUsers()]);
      setTemplates(couponData.templates);
      setIssued(couponData.issued);
      setUsers(nextUsers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "쿠폰을 불러오지 못했어요.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const userName = useMemo(
    () => new Map(users.map((user) => [user.uid, user.name || user.email])),
    [users]
  );

  return (
    <>
      <AdminPageHeader title="쿠폰 관리" />
      <p className="mb-6 max-w-2xl text-sm leading-6 text-muted-foreground">
        여기서 만든 쿠폰을 회원에게 발급하면 마이페이지 쿠폰함에 바로 표시됩니다.
      </p>
      {error ? <AdminNotice message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <AdminPanel title="쿠폰 만들기">
            <form
              className="grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                setSaving(true);
                setError("");
                try {
                  await createAdminCoupon({
                    name: form.name,
                    code: form.code,
                    discountType: form.discountType,
                    discountValue: Number(form.discountValue),
                    minOrder: Number(form.minOrder || 0),
                    expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
                    active: true,
                  });
                  setForm({ name: "", code: "", discountType: "amount", discountValue: "", minOrder: "", expiresAt: "" });
                  await load();
                } catch (saveError) {
                  setError(saveError instanceof Error ? saveError.message : "쿠폰을 만들지 못했어요.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <AdminField label="쿠폰명">
                <input className={adminInputClass} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </AdminField>
              <AdminField label="코드">
                <input className={adminInputClass} value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />
              </AdminField>
              <div className="grid grid-cols-2 gap-3">
                <AdminField label="할인 방식">
                  <select
                    className={adminInputClass}
                    value={form.discountType}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, discountType: event.target.value as "amount" | "percent" }))
                    }
                  >
                    <option value="amount">정액</option>
                    <option value="percent">정률</option>
                  </select>
                </AdminField>
                <AdminField label="할인 값">
                  <input className={adminInputClass} type="number" min="1" value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))} />
                </AdminField>
              </div>
              <AdminField label="최소 주문 금액">
                <input className={adminInputClass} type="number" min="0" value={form.minOrder} onChange={(event) => setForm((current) => ({ ...current, minOrder: event.target.value }))} />
              </AdminField>
              <AdminField label="만료일">
                <input className={adminInputClass} type="date" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} />
              </AdminField>
              <Button type="submit" disabled={saving}>쿠폰 저장</Button>
            </form>
          </AdminPanel>

          <AdminPanel title="회원 발급">
            <form
              className="grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                setSaving(true);
                setError("");
                try {
                  await issueAdminCoupon(issue.couponId, issue.userId);
                  setIssue({ couponId: issue.couponId, userId: "" });
                  await load();
                } catch (saveError) {
                  setError(saveError instanceof Error ? saveError.message : "쿠폰을 발급하지 못했어요.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <AdminField label="쿠폰">
                <select className={adminInputClass} value={issue.couponId} onChange={(event) => setIssue((current) => ({ ...current, couponId: event.target.value }))}>
                  <option value="">선택</option>
                  {templates.filter((item) => item.active).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {formatCouponValue(item)}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="회원">
                <select className={adminInputClass} value={issue.userId} onChange={(event) => setIssue((current) => ({ ...current, userId: event.target.value }))}>
                  <option value="">선택</option>
                  {users.map((user) => (
                    <option key={user.uid} value={user.uid}>
                      {user.name} · {user.email}
                    </option>
                  ))}
                </select>
              </AdminField>
              <Button type="submit" disabled={saving}>마이페이지 쿠폰함에 발급</Button>
            </form>
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel title={`쿠폰 템플릿 ${templates.length}개`}>
            {templates.length === 0 ? <EmptyAdminState text="아직 만든 쿠폰이 없습니다." /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="py-2 pr-3">쿠폰</th>
                      <th className="px-3 py-2">할인</th>
                      <th className="px-3 py-2">만료</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {templates.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 pr-3">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.code}</p>
                        </td>
                        <td className="px-3 py-3">{formatCouponValue(item)}</td>
                        <td className="px-3 py-3 text-muted-foreground">{item.expiresAt ? formatMemberDate(item.expiresAt) : "상시"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminPanel>

          <AdminPanel title={`발급 내역 ${issued.length}건`}>
            {issued.length === 0 ? <EmptyAdminState text="발급된 쿠폰이 없습니다." /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="py-2 pr-3">회원</th>
                      <th className="px-3 py-2">쿠폰</th>
                      <th className="px-3 py-2">상태</th>
                      <th className="px-3 py-2">발급일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {issued.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 pr-3">{userName.get(item.userId) || item.userId}</td>
                        <td className="px-3 py-3">
                          {item.name}
                          <span className="ml-2 text-xs text-muted-foreground">{formatCouponValue(item)}</span>
                        </td>
                        <td className="px-3 py-3">{item.status === "available" ? "사용 가능" : item.status === "used" ? "사용" : "만료"}</td>
                        <td className="px-3 py-3 text-muted-foreground">{formatMemberDate(item.issuedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminPanel>
        </div>
      </div>
    </>
  );
}
