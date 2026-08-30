"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastItem = {
  id: string;
  message: string;
  action?: ToastAction;
};

type ToastContextValue = {
  toast: (message: string, action?: ToastAction) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, action?: ToastAction) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((current) => [...current, { id, message, action }]);
      window.setTimeout(() => dismiss(id), 5600);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--mobile-bottom-nav-offset)+1.25rem)] z-[110] flex flex-col items-center gap-2 px-4 md:bottom-6"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 border border-border bg-foreground px-4 py-3 text-sm text-background shadow-lg"
          >
            <p>{item.message}</p>
            <div className="flex shrink-0 items-center gap-2">
              {item.action ? (
                <button
                  type="button"
                  onClick={() => {
                    item.action?.onClick();
                    dismiss(item.id);
                  }}
                  className="min-h-11 px-2 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
                >
                  {item.action.label}
                </button>
              ) : null}
              <button
                type="button"
                aria-label="알림 닫기"
                onClick={() => dismiss(item.id)}
                className={cn(
                  "grid size-11 place-items-center text-background/70 hover:text-background",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
                )}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast는 ToastProvider 안에서 사용해야 합니다.");
  }
  return context;
}
