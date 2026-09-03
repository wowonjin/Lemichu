"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { AdminField, AdminPanel, adminInputClass, adminTextareaClass } from "@/components/admin/AdminForm";
import { Button } from "@/components/ui/button";
import { deleteAdminFaq, fetchAdminFaqs, saveAdminFaq } from "@/lib/member-account-client";
import { FAQ_CATEGORIES, type MemberFaq } from "@/lib/member-account";

const emptyForm = {
  id: "",
  category: FAQ_CATEGORIES[0] as string,
  question: "",
  answer: "",
  order: "0",
  published: true,
};

export function AdminFaqManagePage() {
  const [items, setItems] = useState<MemberFaq[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError("");
    try {
      setItems(await fetchAdminFaqs());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "FAQ를 불러오지 못했어요.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <AdminPageHeader title="FAQ 관리" />
      <p className="mb-6 max-w-2xl text-sm leading-6 text-muted-foreground">
        저장한 내용은 `/faq`와 마이페이지 자주 묻는 질문에 함께 반영됩니다.
      </p>
      {error ? <AdminNotice message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <AdminPanel title={form.id ? "FAQ 수정" : "FAQ 추가"}>
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setError("");
              try {
                await saveAdminFaq({
                  id: form.id || undefined,
                  category: form.category,
                  question: form.question,
                  answer: form.answer,
                  order: Number(form.order || 0),
                  published: form.published,
                });
                setForm(emptyForm);
                await load();
              } catch (saveError) {
                setError(saveError instanceof Error ? saveError.message : "FAQ를 저장하지 못했어요.");
              } finally {
                setSaving(false);
              }
            }}
          >
            <AdminField label="카테고리">
              <select className={adminInputClass} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                {FAQ_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </AdminField>
            <AdminField label="질문">
              <input className={adminInputClass} value={form.question} onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))} />
            </AdminField>
            <AdminField label="답변">
              <textarea className={adminTextareaClass} value={form.answer} onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))} />
            </AdminField>
            <AdminField label="정렬">
              <input className={adminInputClass} type="number" value={form.order} onChange={(event) => setForm((current) => ({ ...current, order: event.target.value }))} />
            </AdminField>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} />
              공개
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{form.id ? "수정 저장" : "FAQ 추가"}</Button>
              {form.id ? (
                <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>취소</Button>
              ) : null}
            </div>
          </form>
        </AdminPanel>

        <AdminPanel title={`등록 FAQ ${items.length}개`}>
          {items.length === 0 ? <EmptyAdminState text="FAQ가 없습니다. 왼쪽에서 추가하면 마이페이지에 표시됩니다." /> : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{item.category}{item.published ? "" : " · 비공개"}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.question}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setForm({
                      id: item.id,
                      category: item.category,
                      question: item.question,
                      answer: item.answer,
                      order: String(item.order),
                      published: item.published,
                    })}>
                      수정
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!window.confirm("이 FAQ를 삭제할까요?")) return;
                        try {
                          await deleteAdminFaq(item.id);
                          await load();
                        } catch (saveError) {
                          setError(saveError instanceof Error ? saveError.message : "삭제하지 못했어요.");
                        }
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </>
  );
}
