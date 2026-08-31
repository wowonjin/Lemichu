"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export function TossCheckoutSheet({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100]">
          <motion.button
            type="button"
            aria-label="닫기"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/45"
            onClick={onClose}
          />
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-0 md:items-center md:p-6">
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby={labelledBy}
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="pointer-events-auto relative flex w-full max-h-[min(92dvh,760px)] max-w-[400px] flex-col overflow-y-auto overflow-x-hidden rounded-t-[24px] bg-white text-[#191F28] shadow-[0_24px_64px_rgba(15,23,42,0.16),0_4px_16px_rgba(15,23,42,0.08)] md:rounded-[24px] md:ring-1 md:ring-black/10"
            >
              {children}
            </motion.section>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
