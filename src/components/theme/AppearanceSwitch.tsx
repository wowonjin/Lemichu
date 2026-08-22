"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTheme } from "./ThemeProvider";
import type { Theme } from "@/lib/theme";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "화이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
];

export function AppearanceSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolved = mounted ? theme : "light";

  return (
    <div
      role="group"
      aria-label="화면 모드"
      className={cn("grid grid-cols-2 rounded-lg bg-secondary p-1", className)}
    >
      {options.map((option) => {
        const active = resolved === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(option.value)}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-md text-[13px] font-semibold transition-[color,background-color,box-shadow] duration-200",
              active
                ? "bg-background text-foreground shadow-[0_1px_4px_rgba(15,23,42,0.08)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <option.icon className="size-3.5" strokeWidth={1.8} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
