"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { AdminField, adminInputClass } from "@/components/admin/AdminForm";
import {
  fetchAdminSellRequests,
  updateAdminSellRequest,
} from "@/lib/member-account-client";
import {
  SELL_KIND_LABELS,
  SELL_STATUSES,
  SELL_STATUS_LABELS,
  formatMemberDate,
  type SellKind,
  type SellRequest,
  type SellStatus,
} from "@/lib/member-account";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { cn } from "@/lib/cn";

const kindFilters: Array<{ value: "all" | SellKind; label: string }> = [
  { value: "all", label: "전체" },
  { value: "sell", label: "판매" },
  { value: "consignment", label: "위탁" },
  { value: "estimate", label: "시세" },
];

export function AdminSellManagePage() {
  const [items, setItems] = useState<SellRequest[]>([]);
  const [kind, setKind] = useState<"all" | SellKind>("all");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { estimatePrice: string; settlementAmount: string; adminNote: string }>>({});

  const load = async () => {
    setError("");
    try {
      const next = await fetchAdminSellRequests();
      setItems(next);
      setDrafts(
        Object.fromEntries(
          next.map((item) => [
            item.id,
            {
              estimatePrice: item.estimatePrice != null ? String(item.estimatePrice) : "",
              settlementAmount: item.settlementAmount != null ? String(item.settlementAmount) : "",
              adminNote: item.adminNote ?? "",
            },
          ])
        )
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "판매 신청을 불러오지 못했어요.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (kind === "all" ? items : items.filter((item) => item.kind === kind)),
    [items, kind]
  );

  return (
    <AdminShell>
      <AdminPageHeader title="판매·정산 관리" />
      <p className="mb-6 max-w-2xl text-sm leading-6 text-muted-foreground">
        마이페이지의 판매 신청, 위탁, 검수, 정산, 시세 확인이 이 목록과 연결됩니다.
      </p>
      {error ? <AdminNotice message={error} /> : null}

      <div className="mb-5 flex gap-2 overflow-x-auto">
        {kindFilters.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setKind(option.value)}
            className={cn(
              "shrink-0 rounded-md px-3.5 py-2 text-sm font-semibold",
              kind === option.value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? <EmptyAdminState text="신청 내역이 없습니다." /> : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const draft = drafts[item.id] ?? { estimatePrice: "", settlementAmount: "", adminNote: "" };
            return (
              <article key={item.id} className="rounded-xl border border-border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{SELL_KIND_LABELS[item.kind]}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.brand} {item.itemName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.userName} · {item.userEmail} · {item.condition} · {formatMemberDate(item.createdAt)}
                    </p>
                    {item.note ? <p className="mt-2 text-sm text-muted-foreground">{item.note}</p> : null}
                  </div>
                  <select
                    className={adminInputClass}
                    value={item.status}
                    disabled={savingId === item.id}
                    onChange={async (event) => {
                      setSavingId(item.id);
                      setError("");
                      try {
                        await updateAdminSellRequest(item.id, { status: event.target.value as SellStatus });
                        await load();
                      } catch (saveError) {
                        setError(saveError instanceof Error ? saveError.message : "상태를 변경하지 못했어요.");
                      } finally {
                        setSavingId("");
                      }
                    }}
                  >
                    {SELL_STATUSES.map((status) => (
                      <option key={status} value={status}>{SELL_STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <AdminField label="시세/예상가">
                    <input
                      className={adminInputClass}
                      type="number"
                      value={draft.estimatePrice}
                      onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, estimatePrice: event.target.value } }))}
                    />
                  </AdminField>
                  <AdminField label="정산 금액">
                    <input
                      className={adminInputClass}
                      type="number"
                      value={draft.settlementAmount}
                      onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, settlementAmount: event.target.value } }))}
                    />
                  </AdminField>
                  <AdminField label="관리자 메모">
                    <input
                      className={adminInputClass}
                      value={draft.adminNote}
                      onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, adminNote: event.target.value } }))}
                    />
                  </AdminField>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <button
                    type="button"
                    className="font-semibold text-foreground underline-offset-4 hover:underline"
                    disabled={savingId === item.id}
                    onClick={async () => {
                      setSavingId(item.id);
                      setError("");
                      try {
                        await updateAdminSellRequest(item.id, {
                          estimatePrice: draft.estimatePrice ? Number(draft.estimatePrice) : null,
                          settlementAmount: draft.settlementAmount ? Number(draft.settlementAmount) : null,
                          adminNote: draft.adminNote,
                        });
                        await load();
                      } catch (saveError) {
                        setError(saveError instanceof Error ? saveError.message : "저장하지 못했어요.");
                      } finally {
                        setSavingId("");
                      }
                    }}
                  >
                    금액/메모 저장
                  </button>
                  <Link href={`/admin/users/${item.userId}`} className="text-muted-foreground hover:text-foreground">
                    회원 상세
                  </Link>
                  {item.estimatePrice != null ? (
                    <span className="text-muted-foreground">예상가 {formatPriceWithUnit(item.estimatePrice)}</span>
                  ) : null}
                  {item.settlementAmount != null ? (
                    <span className="text-muted-foreground">정산 {formatPriceWithUnit(item.settlementAmount)}</span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
