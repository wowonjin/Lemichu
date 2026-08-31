"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import { useProductVariantPurchase } from "@/components/product/ProductVariantPurchase";
import {
  productActionIconClassName,
  productActionStackClassName,
} from "@/components/product/productActionStyles";
import {
  buildProductInquiryMessage,
  copyTextToClipboard,
  getKakaoChatUrl,
  getPublicProductUrl,
  type ProductInquiryContext,
} from "@/lib/kakao-inquiry";
import {
  formatSizeDisplayLabel,
  getVariantColorLabel,
  getVariantSizeLabel,
} from "@/lib/product-variants";
import type { Product, ProductVariant } from "@/types/product";

function KakaoTalkIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M12 4C6.76 4 2.5 7.35 2.5 11.49c0 2.67 1.78 5.02 4.45 6.35l-.9 3.31a.43.43 0 0 0 .65.47l3.95-2.63c.44.05.9.08 1.35.08 5.24 0 9.5-3.35 9.5-7.58C21.5 7.35 17.24 4 12 4z"
      />
    </svg>
  );
}

function inquiryContextFor(
  product: Product,
  selectedVariant?: ProductVariant
): ProductInquiryContext {
  return {
    productId: product.id,
    brand: product.brand,
    name: product.name,
    color: selectedVariant ? getVariantColorLabel(selectedVariant) : product.color,
    size: selectedVariant
      ? getVariantSizeLabel(selectedVariant)
      : product.size
        ? formatSizeDisplayLabel(product.size)
        : undefined,
  };
}

export function ProductInquiryChat({
  product,
  appearance = "stack",
}: {
  product: Product;
  appearance?: "stack" | "boxed";
}) {
  const { toast } = useToast();
  const { selectedVariant } = useProductVariantPurchase();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const context = inquiryContextFor(product, selectedVariant);
  const productUrl = getPublicProductUrl(product.id);
  const kakaoChatUrl = getKakaoChatUrl();

  const handleSendToKakao = () => {
    const copied = copyTextToClipboard(buildProductInquiryMessage(context, input));
    toast(
      copied
        ? "상품 페이지가 복사되었습니다. 카카오톡에 붙여넣어 보내주세요."
        : "카카오톡에서 상품 페이지 주소를 함께 보내주세요."
    );
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="상품문의"
        className={appearance === "boxed" ? productActionIconClassName : productActionStackClassName}
      >
        <KakaoTalkIcon className="size-5" />
        {appearance === "stack" ? <span>상품문의</span> : null}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-foreground/30 md:bg-transparent"
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              role="dialog"
              aria-label="상품 문의"
              className="fixed inset-x-0 bottom-0 z-[61] mx-auto flex w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-xl md:inset-x-auto md:bottom-6 md:right-6 md:w-[380px] md:rounded-2xl"
            >
              <div className="flex items-center justify-between border-b border-border bg-foreground px-4 py-3 text-background">
                <div>
                  <p className="text-sm font-semibold">레미츄 상품 문의</p>
                  <p className="text-[11px] text-background/70">카카오톡으로 상품 페이지와 함께 전달됩니다</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="닫기"
                  className="grid size-8 place-items-center rounded-md transition-colors hover:bg-background/15"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-3 px-4 py-4">
                <div className="rounded-xl bg-sand px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gold">
                    문의 상품 자동 첨부
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {product.brand} {product.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    상품번호 {product.id.toUpperCase()}
                    {context.color ? ` · ${context.color}` : ""}
                    {context.size ? ` · ${context.size}` : ""}
                  </p>
                  <a
                    href={productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all text-xs font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {productUrl}
                  </a>
                </div>

                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={3}
                  placeholder="문의 내용을 입력하세요 (선택)"
                  className="min-h-[88px] w-full resize-none rounded-xl border border-border bg-background p-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/30"
                />

                <a
                  href={kakaoChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleSendToKakao}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#FEE500] text-sm font-semibold text-[#191919] transition-opacity hover:opacity-90 active:scale-[0.99]"
                >
                  <KakaoTalkIcon className="size-5" />
                  카카오톡으로 문의하기
                </a>
                <p className="text-center text-[11px] leading-5 text-muted-foreground">
                  상품 페이지가 복사됩니다. 카카오톡 입력창에 붙여넣으면 어떤 상품 문의인지 확인할 수 있어요.
                </p>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
