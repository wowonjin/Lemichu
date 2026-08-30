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
    <div className="w-full min-w-0 space-y-2.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => void onGoogle?.()}
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-md border border-border bg-[#f2f4f6] text-sm font-semibold text-foreground transition-colors hover:bg-[#e8ebef] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12"
        )}
      >
        <span className="grid size-5 shrink-0 place-items-center rounded-sm bg-white">
          <Image src="/social-icons/google.svg" alt="" width={18} height={18} aria-hidden />
        </span>
        <span className="truncate">Google로 {verb}</span>
      </button>

      <button
        type="button"
        disabled
        aria-disabled="true"
        className={cn(
          "relative flex h-11 w-full min-w-0 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[#03c75a] bg-[#03c75a] px-12 text-sm font-semibold text-white opacity-60 sm:h-12"
        )}
      >
        <Image src="/social-icons/naver.svg" alt="" width={20} height={20} aria-hidden className="shrink-0" />
        <span className="truncate">네이버로 {verb}</span>
        <span className="absolute right-2.5 text-[11px] font-medium text-white/85 sm:right-3 sm:text-xs">
          준비중
        </span>
      </button>

      <button
        type="button"
        disabled
        aria-disabled="true"
        className={cn(
          "relative flex h-11 w-full min-w-0 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[#fee500] bg-[#fee500] px-12 text-sm font-semibold text-[#191919] opacity-60 sm:h-12"
        )}
      >
        <Image src="/social-icons/kakao.svg" alt="" width={20} height={20} aria-hidden className="shrink-0" />
        <span className="truncate">카카오로 {verb}</span>
        <span className="absolute right-2.5 text-[11px] font-medium text-[#191919]/70 sm:right-3 sm:text-xs">
          준비중
        </span>
      </button>
    </div>
  );
}
