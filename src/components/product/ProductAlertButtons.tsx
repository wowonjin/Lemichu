"use client";

import { useState } from "react";
import { Bell, BellRing, TrendingDown } from "lucide-react";
import { cn } from "@/lib/cn";

function AlertToggle({
  label,
  activeLabel,
  icon: Icon,
  activeIcon: ActiveIcon,
}: {
  label: string;
  activeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  activeIcon: React.ComponentType<{ className?: string }>;
}) {
  const [on, setOn] = useState(false);
  const Current = on ? ActiveIcon : Icon;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      className={cn(
        "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border text-sm font-medium transition-colors",
        on
          ? "border-gold bg-gold-soft/50 text-foreground"
          : "border-border bg-background text-foreground/80 hover:border-foreground/30"
      )}
    >
      <Current className="size-4 text-gold" />
      {on ? activeLabel : label}
    </button>
  );
}

export function ProductAlertButtons() {
  return (
    <div className="mt-3 flex gap-2.5">
      <AlertToggle
        label="재입고 알림"
        activeLabel="재입고 알림 신청됨"
        icon={Bell}
        activeIcon={BellRing}
      />
      <AlertToggle
        label="가격인하 알림"
        activeLabel="가격인하 알림 신청됨"
        icon={TrendingDown}
        activeIcon={TrendingDown}
      />
    </div>
  );
}
