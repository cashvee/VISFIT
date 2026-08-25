"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Droplet, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WaterLog } from "@/db/schema";

interface Props {
  initialTotalMl: number;
  targetMl: number;
  initialLastLog?: WaterLog | null;
}

const PRESETS = [
  { label: "Glass", ml: 200 },
  { label: "Bottle", ml: 500 },
  { label: "Large", ml: 750 },
];

export function WaterTracker({ initialTotalMl, targetMl, initialLastLog }: Props) {
  const t = useTranslations("water");
  const [totalMl, setTotalMl] = useState(initialTotalMl);
  const [lastLogId, setLastLogId] = useState<string | null>(initialLastLog?.id ?? null);
  const [pending, startTransition] = useTransition();
  const pct = Math.min(100, (totalMl / targetMl) * 100);

  const add = (amount: number) => {
    setTotalMl((m) => m + amount);
    startTransition(async () => {
      const res = await fetch("/api/water", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountMl: amount }),
      });
      if (res.ok) {
        const data = (await res.json()) as { row: WaterLog; totalMl: number };
        setLastLogId(data.row.id);
        setTotalMl(data.totalMl);
      } else {
        // rollback optimistic
        setTotalMl((m) => m - amount);
      }
    });
  };

  const undo = () => {
    if (!lastLogId) return;
    const prevId = lastLogId;
    startTransition(async () => {
      const res = await fetch(`/api/water/${prevId}`, { method: "DELETE" });
      if (res.ok) {
        // Refresh totals
        const g = await fetch("/api/water");
        if (g.ok) {
          const data = (await g.json()) as { totalMl: number; rows: WaterLog[] };
          setTotalMl(data.totalMl);
          setLastLogId(data.rows[0]?.id ?? null);
        }
      }
    });
  };

  return (
    <section className="space-y-1.5">
      <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("title")}
      </h2>
      <div className="rounded-2xl bg-card p-4">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-sky-500" fill="currentColor" />
            <p className="text-2xl font-bold tabular-nums">
              {totalMl}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {targetMl} ml
              </span>
            </p>
          </div>
          {lastLogId && (
            <button
              onClick={undo}
              disabled={pending}
              aria-label={t("undo")}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-sky-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.ml}
              type="button"
              disabled={pending}
              onClick={() => add(p.ml)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-xl border border-border bg-muted/40 px-2 py-2.5 text-[11px] font-medium transition-colors",
                "hover:bg-foreground/[0.06] active:scale-[0.97] disabled:opacity-50",
              )}
            >
              <span className="text-base font-semibold">+{p.ml}</span>
              <span className="text-muted-foreground">ml</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
