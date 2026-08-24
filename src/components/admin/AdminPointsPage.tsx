"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { AdminField, AdminPanel, adminInputClass } from "@/components/admin/AdminForm";
import { Button } from "@/components/ui/button";
import { fetchAdminUsers, type AdminUserProfile } from "@/lib/admin";
import { adjustAdminPoints } from "@/lib/member-account-client";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { toSafePoints } from "@/lib/points";

export function AdminPointsPage() {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userId: "", amount: "", reason: "" });

  const load = async () => {
    setError("");
    try {
      setUsers(await fetchAdminUsers());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "회원 목록을 불러오지 못했어요.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminShell>
      <AdminPageHeader title="적립금 관리" />
      <p className="mb-6 max-w-2xl text-sm leading-6 text-muted-foreground">
        지급·차감한 적립금은 회원 마이페이지 적립금 내역에 바로 반영됩니다.
      </p>
      {error ? <AdminNotice message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <AdminPanel title="적립금 조정">
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setError("");
              try {
                await adjustAdminPoints({
                  userId: form.userId,
                  amount: Number(form.amount),
                  reason: form.reason,
                });
                setForm({ userId: form.userId, amount: "", reason: "" });
                await load();
              } catch (saveError) {
                setError(saveError instanceof Error ? saveError.message : "적립금을 조정하지 못했어요.");
              } finally {
                setSaving(false);
              }
            }}
          >
            <AdminField label="회원">
              <select className={adminInputClass} value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}>
                <option value="">선택</option>
                {users.map((user) => (
                  <option key={user.uid} value={user.uid}>
                    {user.name} · 보유 {formatPriceWithUnit(toSafePoints(user.points))}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="금액 (지급은 +, 차감은 -)">
              <input className={adminInputClass} type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="예: 1000 또는 -500" />
            </AdminField>
            <AdminField label="사유">
              <input className={adminInputClass} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="관리자 지급" />
            </AdminField>
            <Button type="submit" disabled={saving}>마이페이지 내역에 반영</Button>
          </form>
        </AdminPanel>

        <AdminPanel title="회원별 보유 적립금">
          {users.length === 0 ? <EmptyAdminState text="회원 정보가 없습니다." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-2 pr-3">회원</th>
                    <th className="px-3 py-2">적립금</th>
                    <th className="px-3 py-2">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.uid}>
                      <td className="py-3 pr-3">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="px-3 py-3 font-semibold tabular-nums">
                        {formatPriceWithUnit(toSafePoints(user.points))}
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/admin/users/${user.uid}`} className="text-sm font-semibold text-foreground underline-offset-4 hover:underline">
                          회원 상세
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
