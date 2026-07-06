"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

export function SocialLoginButtons({
  mode = "login",
  onSuccess,
}: {
  mode?: "login" | "signup";
  onSuccess?: () => void;
}) {
  const verb = mode === "signup" ? "가입하기" : "로그인";
  const buttonRadius = mode === "login" ? "rounded-lg" : "rounded-full";
  const handleUnavailableProvider = (provider: string) => {
    window.alert(`${provider} 로그인은 준비 중입니다.`);
  };

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={onSuccess}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 border border-border bg-neutral-200 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-300",
          buttonRadius
        )}
      >
        <span className="grid size-5 place-items-center rounded-sm bg-white">
          <Image src="/social-icons/google.svg" alt="" width={18} height={18} aria-hidden />
        </span>
        Google로 {verb}
      </button>

      <button
        type="button"
        onClick={() => handleUnavailableProvider("네이버")}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 border border-[#03c75a] bg-[#03c75a] text-sm font-semibold text-white transition-colors hover:bg-[#02b351]",
          buttonRadius
        )}
      >
        <Image src="/social-icons/naver.svg" alt="" width={20} height={20} aria-hidden />
        네이버로 {verb}
      </button>

      <button
        type="button"
        onClick={() => handleUnavailableProvider("카카오")}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 border border-[#fee500] bg-[#fee500] text-sm font-semibold text-[#191919] transition-colors hover:bg-[#f4dc00]",
          buttonRadius
        )}
      >
        <Image src="/social-icons/kakao.svg" alt="" width={20} height={20} aria-hidden />
        카카오로 {verb}
      </button>
    </div>
  );
}
