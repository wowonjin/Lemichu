"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { AdminField, adminInputClass } from "@/components/admin/AdminForm";
import { fetchAdminReturns, updateAdminReturn } from "@/lib/member-account-client";
import {
  RETURN_STATUSES,
  RETURN_STATUS_LABELS,
  RETURN_TYPE_LABELS,
  formatMemberDate,
  type ReturnRequest,
  type ReturnStatus,
} from "@/lib/member-account";

export function AdminReturnsManagePage() {
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState("");

  const load = async () => {
    setError("");
    try {
      const next = await fetchAdminReturns();
      setItems(next);
      setNotes(Object.fromEntries(next.map((item) => [item.id, item.adminNote ?? ""])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "신청 내역을 불러오지 못했어요.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminShell>
      <AdminPageHeader title="취소·교환·반품" />
      <p className="mb-6 max-w-2xl text-sm leading-6 text-muted-foreground">
        마이페이지에서 신청한 건을 처리합니다. 취소를 승인하면 해당 주문도 취소 상태로 바뀝니다.
      </p>
      {error ? <AdminNotice message={error} /> : null}

      {items.length === 0 ? <EmptyAdminState text="취소·교환·반품 신청이 없습니다." /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-3 pr-3">신청</th>
                <th className="px-3 py-3">회원</th>
                <th className="px-3 py-3">주문</th>
                <th className="px-3 py-3">상태</th>
                <th className="px-3 py-3">메모</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 pr-3">
                    <p className="font-semibold">{RETURN_TYPE_LABELS[item.type]}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatMemberDate(item.createdAt)}</p>
                  </td>
                  <td className="px-3 py-4">
                    <p>{item.userName}</p>
                    <Link href={`/admin/users/${item.userId}`} className="text-xs text-muted-foreground hover:text-foreground">
                      {item.userEmail}
                    </Link>
                  </td>
                  <td className="px-3 py-4">
                    <Link href="/admin/orders" className="font-semibold underline-offset-4 hover:underline">
                      {item.orderId}
                    </Link>
                  </td>
                  <td className="px-3 py-4">
                    <select
                      className={adminInputClass}
                      value={item.status}
                      disabled={savingId === item.id}
                      onChange={async (event) => {
                        setSavingId(item.id);
                        setError("");
                        try {
                          await updateAdminReturn(item.id, event.target.value as ReturnStatus, notes[item.id]);
                          await load();
                        } catch (saveError) {
                          setError(saveError instanceof Error ? saveError.message : "상태를 변경하지 못했어요.");
                        } finally {
                          setSavingId("");
                        }
                      }}
                    >
                      {RETURN_STATUSES.map((status) => (
                        <option key={status} value={status}>{RETURN_STATUS_LABELS[status]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-4">
                    <AdminField label="관리자 메모">
                      <input
                        className={adminInputClass}
                        value={notes[item.id] ?? ""}
                        onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                        onBlur={async () => {
                          if ((item.adminNote ?? "") === (notes[item.id] ?? "")) return;
                          try {
                            await updateAdminReturn(item.id, item.status, notes[item.id]);
                          } catch (saveError) {
                            setError(saveError instanceof Error ? saveError.message : "메모를 저장하지 못했어요.");
                          }
                        }}
                      />
                    </AdminField>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
