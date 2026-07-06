"use client";

import { useState } from "react";
import type { DailySalesPoint, StatusSlice } from "@/lib/adminStats";
import { formatPriceWithUnit } from "@/lib/formatPrice";
import { cn } from "@/lib/cn";

const VIEW_W = 720;
const VIEW_H = 220;
const PAD_X = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

export function SalesAreaChart({ data }: { data: DailySalesPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="grid h-[220px] place-items-center text-sm text-muted-foreground">
        표시할 매출 데이터가 없습니다.
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((point) => point.revenue), 1);
  const innerW = VIEW_W - PAD_X * 2;
  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;

  const xFor = (index: number) =>
    data.length === 1 ? VIEW_W / 2 : PAD_X + (innerW * index) / (data.length - 1);
  const yFor = (revenue: number) => PAD_TOP + innerH - (innerH * revenue) / maxRevenue;

  const linePath = data
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(point.revenue)}`)
    .join(" ");

  const areaPath =
    `M ${xFor(0)} ${PAD_TOP + innerH} ` +
    data.map((point, index) => `L ${xFor(index)} ${yFor(point.revenue)}`).join(" ") +
    ` L ${xFor(data.length - 1)} ${PAD_TOP + innerH} Z`;

  const active = activeIndex != null ? data[activeIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="일자별 매출 추이"
      >
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="0.28" />
            <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={PAD_X}
            x2={VIEW_W - PAD_X}
            y1={PAD_TOP + innerH * ratio}
            y2={PAD_TOP + innerH * ratio}
            stroke="hsl(var(--border))"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}

        <path d={areaPath} fill="url(#salesFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="hsl(var(--gold))"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {active ? (
          <>
            <line
              x1={xFor(activeIndex!)}
              x2={xFor(activeIndex!)}
              y1={PAD_TOP}
              y2={PAD_TOP + innerH}
              stroke="hsl(var(--gold))"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={xFor(activeIndex!)}
              cy={yFor(active.revenue)}
              r={4.5}
              fill="hsl(var(--background))"
              stroke="hsl(var(--gold))"
              strokeWidth={2.5}
            />
          </>
        ) : null}

        {data.map((point, index) => (
          <rect
            key={index}
            x={xFor(index) - innerW / data.length / 2}
            y={0}
            width={innerW / data.length}
            height={VIEW_H}
            fill="transparent"
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          />
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-1 text-[11px] text-muted-foreground">
        <span>{data[0]?.label}</span>
        {data.length > 2 ? <span>{data[Math.floor(data.length / 2)]?.label}</span> : null}
        <span>{data[data.length - 1]?.label}</span>
      </div>

      {active ? (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-xl border border-border bg-background px-3 py-2 text-center shadow-md">
          <p className="text-[11px] font-medium text-muted-foreground">{active.label}</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {formatPriceWithUnit(active.revenue)}
          </p>
          <p className="text-[11px] text-muted-foreground">주문 {active.orders}건</p>
        </div>
      ) : null}
    </div>
  );
}

const STATUS_BAR_COLORS: Record<string, string> = {
  paid: "bg-emerald-500",
  preparing: "bg-amber-500",
  shipping: "bg-sky-500",
  delivered: "bg-foreground",
  cancelled: "bg-rose-500",
};

export function StatusBars({ data }: { data: StatusSlice[] }) {
  if (data.length === 0) {
    return (
      <div className="grid h-[220px] place-items-center text-sm text-muted-foreground">
        표시할 주문 상태가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((slice) => (
        <div key={slice.status}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{slice.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {slice.count}건 · {Math.round(slice.ratio * 100)}%
            </span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                STATUS_BAR_COLORS[slice.status] ?? "bg-gold"
              )}
              style={{ width: `${Math.max(slice.ratio * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
