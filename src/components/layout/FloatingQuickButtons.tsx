"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import {
  buildProductInquiryMessage,
  copyTextToClipboard,
  getKakaoChatUrl,
  getProductIdFromPathname,
} from "@/lib/kakao-inquiry";

const ICON_VERSION = "20260822c";

const quickButtons = [
  { label: "상품판매하기", href: "/sell", src: `/floating/sell.png?v=${ICON_VERSION}` },
  { label: "고객센터", href: "/faq", src: `/floating/support.png?v=${ICON_VERSION}` },
  { label: "공지사항", href: "/notices", src: `/floating/notice.png?v=${ICON_VERSION}` },
] as const;

function Tooltip({ label }: { label: string }) {
  return <HoverTooltip label={label} placement="left" />;
}

const sideButtonBaseClassName =
  "grid place-items-center rounded-md bg-white ring-1 ring-black/5 transition-transform duration-200 group-hover:-translate-y-0.5";
const sideButtonShadowClassName =
  "shadow-[0_2px_6px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.12)] group-hover:shadow-[0_4px_10px_rgba(15,23,42,0.1),0_12px_24px_rgba(15,23,42,0.16)]";

function SideIcon({ src, label, size }: { src: string; label: string; size: number }) {
  return (
    <Image
      src={src}
      alt={label}
      width={size}
      height={size}
      unoptimized
      className="size-[62%] object-contain transition-transform duration-200 group-hover:scale-105"
    />
  );
}

function TopIcon() {
  return (
    <ArrowUp
      aria-hidden
      strokeWidth={2.4}
      className="size-[42%] text-gold transition-transform duration-200 group-hover:scale-105"
    />
  );
}

function KakaoInquiryButton({
  sizeClassName,
  buttonClassName,
}: {
  sizeClassName: string;
  buttonClassName: string;
}) {
  const pathname = usePathname();
  const { toast } = useToast();
  const productId = getProductIdFromPathname(pathname ?? "");

  return (
    <a
      href={getKakaoChatUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="카카오톡 문의"
      onClick={() => {
        if (!productId) return;
        const copied = copyTextToClipboard(buildProductInquiryMessage({ productId }));
        toast(
          copied
            ? "상품 페이지가 복사되었습니다. 카카오톡에 붙여넣어 보내주세요."
            : "카카오톡에서 상품 페이지 주소를 함께 보내주세요."
        );
      }}
      className={cn("group", buttonClassName, "bg-[#FEE500]", sizeClassName)}
    >
      <Image
        src="/floating/kakaotalk.svg"
        alt="카카오톡 문의"
        width={72}
        height={72}
        unoptimized
        className="size-[62%] object-contain transition-transform duration-200 group-hover:scale-105"
      />
    </a>
  );
}

export function FloatingQuickButtons() {
  const pathname = usePathname();
  const sideButtonClassName =
    pathname === "/my"
      ? sideButtonBaseClassName
      : `${sideButtonBaseClassName} ${sideButtonShadowClassName}`;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="fixed right-3 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-end gap-2 md:right-5 md:flex">
        {quickButtons.map((button) => (
          <div key={button.href} className="group flex items-center gap-2.5">
            <Tooltip label={button.label} />
            <Link
              href={button.href}
              aria-label={button.label}
              className={`${sideButtonClassName} size-[58px]`}
            >
              <SideIcon src={button.src} label={button.label} size={72} />
            </Link>
          </div>
        ))}
        <div className="group flex items-center gap-2.5">
          <Tooltip label="카카오톡 문의" />
          <KakaoInquiryButton
            sizeClassName="size-[58px]"
            buttonClassName={sideButtonClassName}
          />
        </div>
        <div className="group flex items-center gap-2.5">
          <Tooltip label="맨위로" />
          <button
            type="button"
            aria-label="맨위로"
            onClick={scrollToTop}
            className={`${sideButtonClassName} size-[58px]`}
          >
            <TopIcon />
          </button>
        </div>
      </div>

      <div className="fixed bottom-20 right-2.5 z-40 flex flex-col items-end gap-1.5 md:hidden">
        {quickButtons.map((button) => (
          <Link
            key={button.href}
            href={button.href}
            aria-label={button.label}
            className={`group ${sideButtonClassName} size-12`}
          >
            <SideIcon src={button.src} label={button.label} size={60} />
          </Link>
        ))}
        <KakaoInquiryButton sizeClassName="size-12" buttonClassName={sideButtonClassName} />
        <button
          type="button"
          aria-label="맨위로"
          onClick={scrollToTop}
          className={`group ${sideButtonClassName} size-12`}
        >
          <TopIcon />
        </button>
      </div>
    </>
  );
}
