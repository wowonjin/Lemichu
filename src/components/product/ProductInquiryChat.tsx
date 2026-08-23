"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Headset } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { Product } from "@/types/product";

type ChatMessage = {
  id: string;
  role: "agent" | "user";
  text: string;
};

function buildGreeting(product: Product): string {
  const colorPart = product.color ? ` ${product.color}` : "";
  return `안녕하세요.\n\n${product.brand} ${product.name}${colorPart} 상품 문의드립니다.`;
}

export function ProductInquiryChat({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "agent", text: "안녕하세요, 레미츄 상담팀입니다. 문의 남겨주시면 순차적으로 답변드릴게요." },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const contextRows = [
    { label: "상품명", value: `${product.brand} ${product.name}` },
    { label: "상품번호", value: product.id.toUpperCase() },
    { label: "사이즈", value: product.size ?? "단일 사이즈" },
    { label: "색상", value: product.color ?? "옵션 선택" },
  ];

  useEffect(() => {
    if (open) setInput(buildGreeting(product));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "agent", text: "문의 감사합니다. 담당 상담원이 확인 후 영업시간 내 빠르게 답변드리겠습니다. (평일 10:00-18:00)" }]);
    }, 700);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#EBEBEB] bg-background text-sm font-semibold text-foreground transition-colors hover:bg-[#F7F7F7] dark:border-border dark:hover:bg-muted">
        <MessageCircle className="size-4 text-gold" />
        상품 문의하기
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[60] bg-foreground/30 md:bg-transparent" />
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} role="dialog" aria-label="상품 문의 채팅" className="fixed inset-x-0 bottom-0 z-[61] mx-auto flex h-[78vh] max-h-[640px] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-xl md:inset-x-auto md:bottom-6 md:right-6 md:h-[560px] md:w-[380px] md:rounded-2xl">
              <div className="flex items-center justify-between border-b border-border bg-foreground px-4 py-3 text-background">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-background/15"><Headset className="size-4" /></span>
                  <div>
                    <p className="text-sm font-semibold">레미츄 상품 문의</p>
                    <p className="text-[11px] text-background/70">평일 10:00-18:00 운영</p>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="닫기" className="grid size-8 place-items-center rounded-full transition-colors hover:bg-background/15"><X className="size-4" /></button>
              </div>

              <div className="border-b border-border bg-sand px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gold">문의 상품 자동 첨부</p>
                <dl className="mt-2 space-y-1">
                  {contextRows.map((row) => (
                    <div key={row.label} className="flex gap-2 text-xs">
                      <dt className="w-12 shrink-0 text-muted-foreground">{row.label}</dt>
                      <dd className="font-medium text-foreground">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((message) => (
                  <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                    <p className={cn("max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed", message.role === "user" ? "rounded-br-sm bg-foreground text-background" : "rounded-bl-sm bg-secondary text-foreground")}>{message.text}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border p-3">
                <div className="flex items-end gap-2">
                  <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} rows={2} placeholder="문의 내용을 입력하세요" className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-background p-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/30" />
                  <button type="button" onClick={send} disabled={!input.trim()} aria-label="전송" className="grid size-11 shrink-0 place-items-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"><Send className="size-4" /></button>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
