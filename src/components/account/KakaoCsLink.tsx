"use client";

import type { ReactNode } from "react";
import { useToast } from "@/components/ui/toast";
import {
  copyTextToClipboard,
  getKakaoChatUrl,
} from "@/lib/kakao-inquiry";

export function KakaoCsLink({
  className,
  children,
  message,
  copiedMessage = "문의 내용이 복사되었습니다. 카카오톡에 붙여넣어 보내주세요.",
}: {
  className?: string;
  children: ReactNode;
  message?: string;
  copiedMessage?: string;
}) {
  const { toast } = useToast();

  return (
    <a
      href={getKakaoChatUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        if (!message) return;
        const copied = copyTextToClipboard(message);
        toast(copied ? copiedMessage : "카카오톡에서 문의 내용을 함께 보내주세요.");
      }}
    >
      {children}
    </a>
  );
}
