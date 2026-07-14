"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { AdminPageHeader, AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyAdminState } from "@/components/admin/AdminDashboard";
import { fetchAdminUsers, type AdminUserProfile } from "@/lib/admin";
import { cn } from "@/lib/cn";

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setIsLoading(true);
      setError("");

      try {
        const nextUsers = await fetchAdminUsers();
        if (!cancelled) setUsers(nextUsers);
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

  return (
    <AdminShell>
      <AdminPageHeader title="회원 목록" />

      {error ? <AdminNotice message={error} /> : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex h-11 items-center gap-2 rounded-md border border-border bg-secondary px-4 md:min-w-80">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름, 이메일, 권한 검색"
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          총 <span className="font-semibold text-foreground">{filteredUsers.length}</span>명
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
              <th className="px-4 py-3 font-semibold last:pr-0">권한</th>
              <th className="px-4 py-3 font-semibold last:pr-0">최근 로그인</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <tr key={user.uid} className="transition-colors hover:bg-secondary/50">
                <td className="py-4 pr-4 first:pl-0">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-sm font-bold text-background">
                      {user.name?.slice(0, 1) || "U"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.uid}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-4 text-muted-foreground">{user.phone ?? "-"}</td>
                <td className="px-4 py-4 text-muted-foreground">{user.provider}</td>
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
                  {user.lastLoginAt?.toDate().toLocaleString("ko-KR") ?? "-"}
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
    </AdminShell>
  );
}
