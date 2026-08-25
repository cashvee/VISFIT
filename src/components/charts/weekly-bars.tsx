"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DailyTotal } from "@/lib/stats";

interface Props {
  series: DailyTotal[]; // chronological, oldest first
  target?: number;
  label?: string;
}

export function WeeklyBars({ series, target, label }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(target ?? 0, ...series.map((d) => d.calories), 1);

  const dowFmt = new Intl.DateTimeFormat("en-GB", {
    weekday: "narrow",
  });
  const fullFmt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  });

  const focus = hover !== null ? series[hover] : null;
  const todayKey = series[series.length - 1]?.date;

  return (
    <div className="rounded-2xl bg-card px-4 py-4">
      <div className="flex items-baseline justify-between">
        <div>
          {label && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
          )}
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {focus ? Math.round(focus.calories) : Math.round(series.reduce((s, d) => s + d.calories, 0) / Math.max(1, series.filter((d) => d.count > 0).length))}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              kcal
            </span>
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {focus ? fullFmt.format(new Date(focus.date + "T00:00:00")) : ""}
        </p>
      </div>

      <div className="mt-3 flex h-24 items-end justify-between gap-1.5">
        {series.map((d, i) => {
          const h = (d.calories / max) * 100;
          const isToday = d.date === todayKey;
          const isHover = hover === i;
          return (
            <button
              key={d.date}
              type="button"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${fullFmt.format(new Date(d.date + "T00:00:00"))}: ${Math.round(d.calories)} kcal`}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <div className="relative flex h-full w-full items-end overflow-hidden rounded-md">
                <div
                  className={cn(
                    "w-full rounded-md transition-all",
                    isHover
                      ? "bg-foreground"
                      : isToday
                        ? "bg-foreground"
                        : "bg-foreground/40",
                  )}
                  style={{ height: `${Math.max(h, 3)}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        {series.map((d) => (
          <span key={d.date} className="flex-1 text-center uppercase">
            {dowFmt.format(new Date(d.date + "T00:00:00"))}
          </span>
        ))}
      </div>

      {target && target > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px]">
          <span className="text-muted-foreground">Target</span>
          <span className="tabular-nums">{target} kcal</span>
        </div>
      )}
    </div>
  );
}
