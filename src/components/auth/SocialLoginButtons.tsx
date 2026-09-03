"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

export function SocialLoginButtons({
  mode = "login",
  onGoogle,
  onNaver,
  disabled = false,
}: {
  mode?: "login" | "signup";
  onGoogle?: () => void | Promise<void>;
  onNaver?: () => void | Promise<void>;
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
        disabled={disabled}
        onClick={() => void onNaver?.()}
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-md border border-[#03c75a] bg-[#03c75a] text-sm font-semibold text-white transition-colors hover:bg-[#02b351] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12"
        )}
      >
        <Image src="/social-icons/naver.svg" alt="" width={20} height={20} aria-hidden className="shrink-0" />
        <span className="truncate">네이버로 {verb}</span>
      </button>
    </div>
  );
}
