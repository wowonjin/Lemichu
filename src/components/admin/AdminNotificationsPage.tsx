"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { AdminField, AdminPanel, adminInputClass, adminTextareaClass } from "@/components/admin/AdminForm";
import { Button } from "@/components/ui/button";
import { fetchAdminUsers, type AdminUserProfile } from "@/lib/admin";
import { fetchAdminNotifications, sendAdminNotification } from "@/lib/member-account-client";
import {
  NOTIFICATION_KIND_LABELS,
  NOTIFICATION_KINDS,
  formatMemberDate,
  type MemberNotification,
  type MemberNotificationKind,
} from "@/lib/member-account";

export function AdminNotificationsManagePage() {
  const [items, setItems] = useState<MemberNotification[]>([]);
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    href: "/my/notifications",
    kind: "event" as MemberNotificationKind,
    userId: "",
  });

  const load = async () => {
    setError("");
    try {
      const [nextItems, nextUsers] = await Promise.all([fetchAdminNotifications(), fetchAdminUsers()]);
      setItems(nextItems);
      setUsers(nextUsers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "알림을 불러오지 못했어요.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminShell>
      <AdminPageHeader title="회원 알림" />
      <p className="mb-6 max-w-2xl text-sm leading-6 text-muted-foreground">
        보낸 알림은 마이페이지 대시보드와 알림 페이지에 표시됩니다. 회원의 알림 설정은 회원 상세에서 확인할 수 있습니다.
      </p>
      {error ? <AdminNotice message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <AdminPanel title="알림 보내기">
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setError("");
              try {
                await sendAdminNotification({
                  title: form.title,
                  body: form.body,
                  href: form.href,
                  kind: form.kind,
                  userId: form.userId || undefined,
                });
                setForm((current) => ({ ...current, title: "", body: "" }));
                await load();
              } catch (saveError) {
                setError(saveError instanceof Error ? saveError.message : "알림을 보내지 못했어요.");
              } finally {
                setSaving(false);
              }
            }}
          >
            <AdminField label="대상">
              <select className={adminInputClass} value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}>
                <option value="">전체 회원</option>
                {users.map((user) => (
                  <option key={user.uid} value={user.uid}>{user.name} · {user.email}</option>
                ))}
              </select>
            </AdminField>
            <AdminField label="종류">
              <select
                className={adminInputClass}
                value={form.kind}
                onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as MemberNotificationKind }))}
              >
                {NOTIFICATION_KINDS.map((kind) => (
                  <option key={kind} value={kind}>{NOTIFICATION_KIND_LABELS[kind]}</option>
                ))}
              </select>
            </AdminField>
            <AdminField label="제목">
              <input className={adminInputClass} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </AdminField>
            <AdminField label="내용">
              <textarea className={adminTextareaClass} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} />
            </AdminField>
            <AdminField label="이동 경로">
              <input className={adminInputClass} value={form.href} onChange={(event) => setForm((current) => ({ ...current, href: event.target.value }))} />
            </AdminField>
            <Button type="submit" disabled={saving}>마이페이지로 보내기</Button>
          </form>
        </AdminPanel>

        <AdminPanel title={`발송 내역 ${items.length}건`}>
          {items.length === 0 ? <EmptyAdminState text="보낸 알림이 없습니다." /> : (
            <ul className="divide-y divide-border">
              {items.slice(0, 40).map((item) => (
                <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {NOTIFICATION_KIND_LABELS[item.kind]} · {item.read ? "읽음" : "안읽음"} · {formatMemberDate(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
