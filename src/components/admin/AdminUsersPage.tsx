"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PackageCheck, Search, ShieldCheck } from "lucide-react";
import { GRADE_LABELS, resolveMemberGrade } from "@/lib/member-account";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { toSafePoints } from "@/lib/points";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { fetchAdminUsers, type AdminUserProfile } from "@/lib/admin";
import { toDateValue } from "@/lib/admin-serialize";
import { fetchAdminLogiiShipments } from "@/lib/member-account-client";
import type { LogiiShipmentRecord } from "@/lib/logii-delivery";
import { getCourierTrackingUrl } from "@/lib/courier";
import { cn } from "@/lib/cn";

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [logiiShipments, setLogiiShipments] = useState<LogiiShipmentRecord[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setIsLoading(true);
      setError("");

      try {
        const [nextUsers, nextShipments] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminLogiiShipments(),
        ]);
        if (!cancelled) {
          setUsers(nextUsers);
          setLogiiShipments(nextShipments);
        }
      } catch (adminError) {
        if (!cancelled) {
          setError(
            adminError instanceof Error
              ? adminError.message
              : "회원 목록을 불러오지 못했어요."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((user) =>
      [user.name, user.email, user.phone, user.role, user.provider].some((value) =>
        value?.toLowerCase().includes(keyword)
      )
    );
  }, [query, users]);

  const filteredLogiiShipments = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return logiiShipments;

    return logiiShipments.filter((shipment) =>
      [
        shipment.recipientName,
        shipment.recipientPhone,
        shipment.recipientAddress,
        shipment.itemName,
        shipment.reservationNo,
        shipment.invoiceNo,
        shipment.service,
      ].some((value) => value?.toLowerCase().includes(keyword))
    );
  }, [logiiShipments, query]);

  const logiiCustomerCount = useMemo(
    () =>
      new Set(
        filteredLogiiShipments.map(
          (shipment) =>
            `${shipment.recipientName.trim()}|${shipment.recipientPhone.trim()}`
        )
      ).size,
    [filteredLogiiShipments]
  );

  return (
    <>
      <AdminPageHeader title="고객 목록" />

      {error ? <AdminNotice message={error} /> : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex h-11 items-center gap-2 rounded-md border border-border bg-secondary px-4 md:min-w-80">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름, 이메일, 연락처, 송장 검색"
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          회원 <span className="font-semibold text-foreground">{filteredUsers.length}</span>명
          {" · "}
          로지아이 고객{" "}
          <span className="font-semibold text-foreground">{logiiCustomerCount}</span>명
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-3 pr-4 font-semibold first:pl-0 last:pr-0">회원</th>
              <th className="px-4 py-3 font-semibold last:pr-0">이메일</th>
              <th className="px-4 py-3 font-semibold last:pr-0">휴대전화번호</th>
              <th className="px-4 py-3 font-semibold last:pr-0">가입 방식</th>
              <th className="px-4 py-3 font-semibold last:pr-0">등급</th>
              <th className="px-4 py-3 font-semibold last:pr-0">적립금</th>
              <th className="px-4 py-3 font-semibold last:pr-0">권한</th>
              <th className="px-4 py-3 font-semibold last:pr-0">최근 로그인</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <tr key={user.uid} className="transition-colors hover:bg-secondary/50">
                <td className="py-4 pr-4 first:pl-0">
                  <Link href={`/admin/users/${user.uid}`} className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-foreground text-sm font-bold text-background">
                      {user.name?.slice(0, 1) || "U"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.uid}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-4 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-4 text-muted-foreground">{user.phone ?? "-"}</td>
                <td className="px-4 py-4 text-muted-foreground">{user.provider}</td>
                <td className="px-4 py-4 text-muted-foreground">
                  {GRADE_LABELS[resolveMemberGrade(user.grade)]}
                </td>
                <td className="px-4 py-4 tabular-nums text-muted-foreground">
                  {formatPriceWithUnit(toSafePoints(user.points))}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-semibold",
                      user.role === "admin" ? "text-gold" : "text-muted-foreground"
                    )}
                  >
                    {user.role === "admin" ? <ShieldCheck className="size-3.5" /> : null}
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {toDateValue(user.lastLoginAt)?.toLocaleString("ko-KR") ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && filteredUsers.length === 0 ? (
          <EmptyAdminState text="검색 결과에 해당하는 회원이 없습니다." />
        ) : null}

        {isLoading ? <EmptyAdminState text="회원 목록을 불러오는 중입니다." /> : null}
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              로지아이 배송 고객
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              회원 주문과 연결되지 않은 외부 주문도 수취인 기준으로 안전하게 보관합니다.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            배송 {filteredLogiiShipments.length}건
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-3 pr-4 font-semibold">고객</th>
                <th className="px-4 py-3 font-semibold">배송지</th>
                <th className="px-4 py-3 font-semibold">물품</th>
                <th className="px-4 py-3 font-semibold">택배 예약</th>
                <th className="px-4 py-3 font-semibold">운송장</th>
                <th className="px-4 py-3 font-semibold">연동 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogiiShipments.map((shipment) => (
                <tr
                  key={shipment.id}
                  className="transition-colors hover:bg-secondary/50"
                >
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-sm font-bold text-foreground">
                        {shipment.recipientName.slice(0, 1) || "고"}
                      </span>
                      <div>
                        {shipment.userId ? (
                          <Link
                            href={`/admin/users/${shipment.userId}`}
                            className="font-semibold text-foreground hover:underline"
                          >
                            {shipment.recipientName}
                          </Link>
                        ) : (
                          <p className="font-semibold text-foreground">
                            {shipment.recipientName}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {shipment.recipientPhone || "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-4 text-xs leading-5 text-muted-foreground">
                    {shipment.recipientAddress || "-"}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-foreground">
                      {shipment.itemName || "물품명 없음"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {shipment.parcelSize}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    <p>{shipment.service}</p>
                    <p className="mt-1 tabular-nums">
                      {shipment.bookedAt} · {shipment.reservationNo}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs tabular-nums text-muted-foreground">
                    <LogiiShipmentInvoice shipment={shipment} />
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-semibold",
                        shipment.matchStatus === "matched"
                          ? "text-emerald-700"
                          : shipment.matchStatus === "ambiguous"
                            ? "text-amber-700"
                            : "text-muted-foreground"
                      )}
                    >
                      <PackageCheck className="size-3.5" />
                      {shipment.matchStatus === "matched"
                        ? "회원 주문 연동"
                        : shipment.matchStatus === "ambiguous"
                          ? "확인 필요"
                          : "외부 주문"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLoading && filteredLogiiShipments.length === 0 ? (
            <EmptyAdminState text="등록된 로지아이 배송 고객이 없습니다." />
          ) : null}
        </div>
      </section>
    </>
  );
}

function LogiiShipmentInvoice({
  shipment,
}: {
  shipment: LogiiShipmentRecord;
}) {
  if (!shipment.invoiceNo) return <>미발급</>;
  const trackingUrl = getCourierTrackingUrl(
    shipment.service,
    shipment.invoiceNo
  );
  if (!trackingUrl) return <>{shipment.invoiceNo}</>;

  return (
    <a
      href={trackingUrl}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-foreground underline-offset-4 hover:underline"
    >
      {shipment.invoiceNo}
    </a>
  );
}
