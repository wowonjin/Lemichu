"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuthUser";
import { getLoginHref } from "@/lib/redirect";
import { AccountCtaLink, AccountEmptyState, AccountSection, AccountSkeleton } from "./AccountPageShell";

export function AuthGate({
  children,
  description,
}: {
  children: ReactNode;
  description?: string;
}) {
  const pathname = usePathname() ?? "/my";
  const { user, ready } = useAuthUser();

  if (!ready) {
    return (
      <AccountSection>
        <AccountSkeleton rows={4} />
      </AccountSection>
    );
  }

  if (!user) {
    return (
      <AccountSection>
        <AccountEmptyState
          title="로그인이 필요해요"
          description={description ?? "로그인하면 주문, 찜, 계정 정보를 이어서 확인할 수 있어요."}
          action={<AccountCtaLink href={getLoginHref(pathname)}>로그인하기</AccountCtaLink>}
        />
      </AccountSection>
    );
  }

  return <>{children}</>;
}
