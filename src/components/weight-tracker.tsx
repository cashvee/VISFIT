"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionGroup } from "@/components/ui/section";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { WeightLog } from "@/db/schema";

interface Props {
  initial: WeightLog[];
}

export function WeightTracker({ initial }: Props) {
  const t = useTranslations("weight");
  const tCommon = useTranslations("common");

  const [rows, setRows] = useState<WeightLog[]>(initial);
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(String(initial[0]?.weightKg ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute chart
  const sorted = [...rows].sort((a, b) => {
    const ax = a.loggedAt instanceof Date ? a.loggedAt : new Date(a.loggedAt as unknown as number);
    const bx = b.loggedAt instanceof Date ? b.loggedAt : new Date(b.loggedAt as unknown as number);
    return ax.getTime() - bx.getTime();
  });

  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const deltaTotal = latest && first ? latest.weightKg - first.weightKg : 0;

  const max = sorted.length > 0 ? Math.max(...sorted.map((r) => r.weightKg)) : 0;
  const min = sorted.length > 0 ? Math.min(...sorted.map((r) => r.weightKg)) : 0;
  const range = Math.max(0.5, max - min);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weightKg: Number(val) }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Failed");
      }
      const data = (await res.json()) as { row: WeightLog };
      setRows((r) => [data.row, ...r]);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/weight/${id}`, { method: "DELETE" });
    if (res.ok) setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Hero stat */}
      <div className="rounded-2xl bg-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("currentWeight")}
        </p>
        <p className="mt-1 text-4xl font-bold tabular-nums">
          {latest ? latest.weightKg.toFixed(1) : "—"}
          <span className="ml-1 text-base font-normal text-muted-foreground">kg</span>
        </p>
        {rows.length > 1 && (
          <p
            className={cn(
              "mt-1 text-sm font-medium tabular-nums",
              deltaTotal < 0 ? "text-emerald-500" : deltaTotal > 0 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {deltaTotal > 0 ? "+" : ""}
            {deltaTotal.toFixed(1)} kg · {t("sinceStart")}
          </p>
        )}
      </div>

      <Button onClick={() => setOpen(true)} size="lg" className="w-full">
        <Plus className="h-5 w-5" />
        {t("log")}
      </Button>

      {open && (
        <form onSubmit={onSubmit} className="rounded-2xl bg-card p-4 space-y-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("weightKg")}
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min={20}
              max={400}
              step="0.1"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              autoFocus
              className="mt-1"
            />
          </label>
          {error && (
            <div role="alert" className="rounded-xl bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {tCommon("save") ?? "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </form>
      )}

      {sorted.length >= 2 && (
        <section className="space-y-1.5">
          <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("trend")}
          </h2>
          <div className="rounded-2xl bg-card p-4">
            <div className="flex h-32 items-end gap-1">
              {sorted.slice(-26).map((r) => {
                const h = ((r.weightKg - min) / range) * 100;
                return (
                  <div
                    key={r.id}
                    className="flex-1 rounded-md bg-foreground/40 transition-all"
                    style={{ height: `${Math.max(8, h)}%` }}
                    title={`${r.weightKg} kg`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>
                {sorted[0] && formatDate(
                  sorted[0].loggedAt instanceof Date ? sorted[0].loggedAt : new Date(sorted[0].loggedAt as unknown as number),
                )}
              </span>
              <span>
                {latest && formatDate(
                  latest.loggedAt instanceof Date ? latest.loggedAt : new Date(latest.loggedAt as unknown as number),
                )}
              </span>
            </div>
          </div>
        </section>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-card px-5 py-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <SectionGroup title={t("history")}>
          {rows.map((r, i) => {
            const at = r.loggedAt instanceof Date ? r.loggedAt : new Date(r.loggedAt as unknown as number);
            const prev = rows[i + 1];
            const delta = prev ? r.weightKg - prev.weightKg : null;
            return (
              <div
                key={r.id}
                className="relative flex items-center gap-3 px-4 py-3.5 before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border last:before:hidden"
              >
                <div className="flex-1">
                  <div className="text-[15px] font-semibold tabular-nums">
                    {r.weightKg.toFixed(1)} kg
                    {delta !== null && delta !== 0 && (
                      <span
                        className={cn(
                          "ml-2 text-xs font-medium tabular-nums",
                          delta < 0 ? "text-emerald-500" : "text-destructive",
                        )}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(at)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(r.id)}
                  aria-label={tCommon("delete")}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </SectionGroup>
      )}
    </div>
  );
}
