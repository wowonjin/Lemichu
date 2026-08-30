import { ChevronRight } from "lucide-react";
import { getKakaoChannelUrl } from "@/lib/kakao-inquiry";

export function KakaoChannelBanner() {
  return (
    <a
      href={getKakaoChannelUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 flex h-11 items-center gap-2 rounded-md bg-[#FEE500] px-3 text-[13px] font-medium text-[#191919] transition-opacity hover:opacity-90"
    >
      <span
        aria-hidden
        className="grid size-6 place-items-center rounded-full bg-[#191919] text-[8px] font-bold leading-none text-[#FEE500]"
      >
        Ch
      </span>
      <span className="min-w-0 flex-1">
        카카오톡 채널 추가하고, <span className="font-bold">할인 소식</span> 받기
      </span>
      <ChevronRight className="size-4 shrink-0" />
    </a>
  );
}
