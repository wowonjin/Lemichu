"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

export function SocialLoginButtons({
  mode = "login",
  onGoogle,
  disabled = false,
}: {
  mode?: "login" | "signup";
  onGoogle?: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const verb = mode === "signup" ? "가입하기" : "로그인";

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => void onGoogle?.()}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-[#f2f4f6] text-sm font-semibold text-foreground transition-colors hover:bg-[#e8ebef] disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        <span className="grid size-5 place-items-center rounded-sm bg-white">
          <Image src="/social-icons/google.svg" alt="" width={18} height={18} aria-hidden />
        </span>
        Google로 {verb}
      </button>

      <button
        type="button"
        disabled
        aria-disabled="true"
        className={cn(
          "relative flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[#03c75a] bg-[#03c75a] text-sm font-semibold text-white opacity-60"
        )}
      >
        <Image src="/social-icons/naver.svg" alt="" width={20} height={20} aria-hidden />
        네이버로 {verb}
        <span className="absolute right-3 text-xs font-medium text-white/85">준비중</span>
      </button>

      <button
        type="button"
        disabled
        aria-disabled="true"
        className={cn(
          "relative flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[#fee500] bg-[#fee500] text-sm font-semibold text-[#191919] opacity-60"
        )}
      >
        <Image src="/social-icons/kakao.svg" alt="" width={20} height={20} aria-hidden />
        카카오로 {verb}
        <span className="absolute right-3 text-xs font-medium text-[#191919]/70">준비중</span>
      </button>
    </div>
  );
}
