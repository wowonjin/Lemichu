"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Landmark,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import {
  AdminMetricCard,
  AdminPageHeader,
  AdminShell,
} from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { Button } from "@/components/ui/button";
import {
  fetchAdminBankDeposits,
  fetchBankDepositCandidates,
  manuallyMatchBankDeposit,
  type AdminBankDepositCandidate,
  type AdminBankDepositEvent,
  type AdminBankRelayOverview,
} from "@/lib/bank-deposit-admin";
import { cn } from "@/lib/cn";
import { formatPriceWithUnit } from "@/lib/formatPrice";

const statusLabel: Record<AdminBankDepositEvent["status"], string> = {
  RECEIVED: "수신",
  MATCHED: "자동매칭",
  UNMATCHED: "미확인",
  AMBIGUOUS: "중복후보",
  IGNORED: "무시",
};

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function relativeMinutes(value: string | null) {
  if (!value) return "수신 기록 없음";
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
  return minutes < 1 ? "방금 전" : minutes < 60 ? `${minutes}분 전` : `${Math.floor(minutes / 60)}시간 전`;
}

export function AdminBankDepositsPage() {
  const [overview, setOverview] = useState<AdminBankRelayOverview | null>(null);
  const [selected, setSelected] = useState<AdminBankDepositEvent | null>(null);
  const [candidates, setCandidates] = useState<AdminBankDepositCandidate[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [matchingId, setMatchingId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setOverview(await fetchAdminBankDeposits());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "입금 내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openEvent = async (event: AdminBankDepositEvent) => {
    if (!["UNMATCHED", "AMBIGUOUS"].includes(event.status)) return;
    setSelected(event);
    setCandidates([]);
    setReason("");
    setError("");
    try {
      setCandidates(await fetchBankDepositCandidates(event.id));
    } catch (candidateError) {
      setError(
        candidateError instanceof Error
          ? candidateError.message
          : "후보 주문을 불러오지 못했습니다."
      );
    }
  };

  const match = async (candidate: AdminBankDepositCandidate) => {
    if (!selected) return;
    setMatchingId(candidate.orderId);
    setError("");
    try {
      await manuallyMatchBankDeposit(selected.id, candidate.orderId, reason);
      setSelected(null);
      setCandidates([]);
      await load();
    } catch (matchError) {
      setError(matchError instanceof Error ? matchError.message : "수동 입금 처리에 실패했습니다.");
    } finally {
      setMatchingId("");
    }
  };

  const device = overview?.device;
  const healthLabel =
    device?.health === "HEALTHY" ? "정상" : device?.health === "WARNING" ? "주의" : "오프라인";

  return (
    <AdminShell>
      <AdminPageHeader
        title="무통장입금"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            새로고침
          </Button>
        }
      />
      {error ? <AdminNotice message={error} /> : null}

      <section className="grid gap-5 border-y border-border py-6 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="입금 자동감지"
          value={healthLabel}
          icon={device?.health === "OFFLINE" ? WifiOff : CheckCircle2}
        />
        <AdminMetricCard label="오늘 감지" value={`${overview?.stats.todayDetected ?? 0}건`} icon={Landmark} />
        <AdminMetricCard label="자동매칭" value={`${overview?.stats.autoMatched ?? 0}건`} icon={CheckCircle2} />
        <AdminMetricCard label="확인필요" value={`${overview?.stats.needsReview ?? 0}건`} icon={AlertTriangle} />
      </section>

      <section className="mt-7 grid gap-5 rounded-md border border-border p-5 md:grid-cols-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">서버폰</p>
          <p className="mt-2 font-semibold">{device?.phoneNumber || "미등록"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">기기</p>
          <p className="mt-2 font-semibold">{device?.deviceName || "미등록"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{device?.deviceId}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">최근 Heartbeat</p>
          <p className="mt-2 font-semibold">{relativeMinutes(device?.lastSeenAt ?? null)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            배터리 {device?.batteryLevel ?? "-"}% · 대기 {device?.pendingQueueCount ?? 0}건
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">알림 접근</p>
          <p className={cn("mt-2 font-semibold", device?.notificationListenerGranted ? "text-emerald-600" : "text-rose-600")}>
            {device?.notificationListenerGranted ? "허용" : "확인 필요"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">앱 {device?.appVersion || "-"}</p>
        </div>
      </section>

      {selected ? (
        <section className="mt-7 rounded-md border border-amber-300 bg-amber-50/50 p-5 dark:bg-amber-950/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">입금 수동 확인</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {selected.depositorName} · {formatPriceWithUnit(selected.amount)} · {formatDateTime(selected.transactionAt)}
              </p>
            </div>
            <button type="button" className="text-xs font-semibold text-muted-foreground" onClick={() => setSelected(null)}>
              닫기
            </button>
          </div>
          <label className="mt-4 block text-xs font-semibold text-muted-foreground">
            이름 불일치 처리 사유
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="입금자명이 다른 주문을 선택할 때 5자 이상 입력"
              className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none"
            />
          </label>
          <div className="mt-4 grid gap-3">
            {candidates.map((candidate) => (
              <div key={candidate.orderId} className="flex flex-col gap-3 rounded-md border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">#{candidate.orderNo}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {candidate.depositorName} · {formatPriceWithUnit(candidate.expectedAmount)}
                  </p>
                  <p className={cn("mt-1 text-xs font-semibold", candidate.exactName ? "text-emerald-600" : "text-amber-600")}>
                    {candidate.exactName ? "입금자명 정확 일치" : "입금자명 불일치"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={matchingId === candidate.orderId || (!candidate.exactName && reason.trim().length < 5)}
                  onClick={() => void match(candidate)}
                >
                  {matchingId === candidate.orderId ? "처리 중..." : "이 주문으로 입금 처리"}
                </Button>
              </div>
            ))}
            {candidates.length === 0 ? <EmptyAdminState text="같은 금액의 미입금 주문 후보가 없습니다." /> : null}
          </div>
        </section>
      ) : null}

      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="py-3 pr-4 font-semibold">시간</th>
              <th className="px-4 py-3 font-semibold">입금자</th>
              <th className="px-4 py-3 font-semibold">금액</th>
              <th className="px-4 py-3 font-semibold">주문</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="py-3 pl-4 font-semibold">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(overview?.events ?? []).map((event) => (
              <tr key={event.id} className="hover:bg-secondary/50">
                <td className="py-4 pr-4">{formatDateTime(event.transactionAt)}</td>
                <td className="px-4 py-4 font-semibold">{event.depositorName}</td>
                <td className="px-4 py-4 font-semibold tabular-nums">{formatPriceWithUnit(event.amount)}</td>
                <td className="px-4 py-4">{event.matchedOrderId ? `#${event.matchedOrderId}` : "-"}</td>
                <td className="px-4 py-4">
                  <span className={cn("font-semibold", event.status === "MATCHED" ? "text-emerald-600" : ["UNMATCHED", "AMBIGUOUS"].includes(event.status) ? "text-amber-600" : "text-muted-foreground")}>
                    {statusLabel[event.status]}
                  </span>
                </td>
                <td className="py-4 pl-4">
                  {["UNMATCHED", "AMBIGUOUS"].includes(event.status) ? (
                    <button type="button" onClick={() => void openEvent(event)} className="font-semibold underline underline-offset-4">
                      확인
                    </button>
                  ) : event.isTest ? (
                    <span className="text-xs text-muted-foreground">테스트</span>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && (overview?.events.length ?? 0) === 0 ? <EmptyAdminState text="수신된 입금 이벤트가 없습니다." /> : null}
        {loading ? <EmptyAdminState text="입금 내역을 불러오는 중입니다." /> : null}
      </div>
    </AdminShell>
  );
}
