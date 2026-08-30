"use client";

import { Share2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { copyTextToClipboard, getPublicProductUrl } from "@/lib/kakao-inquiry";

export function ProductShareButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const { toast } = useToast();

  return (
    <button
      type="button"
      aria-label="공유하기"
      className="grid size-9 place-items-center text-foreground transition-colors hover:bg-secondary"
      onClick={async () => {
        const url = getPublicProductUrl(productId);
        if (navigator.share) {
          try {
            await navigator.share({ title: productName, url });
            return;
          } catch (error) {
            if (error instanceof Error && error.name === "AbortError") return;
          }
        }
        toast(
          copyTextToClipboard(url)
            ? "상품 링크가 복사되었습니다."
            : "링크를 복사하지 못했어요."
        );
      }}
    >
      <Share2 className="size-[18px]" strokeWidth={1.75} />
    </button>
  );
}
