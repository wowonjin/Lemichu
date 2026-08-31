import { ChevronRight } from "lucide-react";
import { getKakaoChannelUrl } from "@/lib/kakao-inquiry";

function KakaoBubbleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M12 4C6.76 4 2.5 7.35 2.5 11.49c0 2.67 1.78 5.02 4.45 6.35l-.9 3.31a.43.43 0 0 0 .65.47l3.95-2.63c.44.05.9.08 1.35.08 5.24 0 9.5-3.35 9.5-7.58C21.5 7.35 17.24 4 12 4z"
      />
    </svg>
  );
}

export function KakaoChannelBanner() {
  return (
    <a
      href={getKakaoChannelUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 flex items-center gap-3 rounded-2xl bg-[#FEE500] px-3.5 py-3 text-[#191919] transition-transform active:scale-[0.99] md:px-4 md:py-3.5"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#191919] md:size-11">
        <KakaoBubbleIcon className="size-[18px] text-[#FEE500] md:size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold leading-snug tracking-tight">
          카카오톡 채널 추가
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug text-[#191919]/65">
          할인 · 입고 소식을 가장 먼저 받아보세요
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-[#191919]/35" />
    </a>
  );
}
