"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface Totals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface Targets {
  target: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function DailySummary({
  totals,
  targets,
}: {
  totals: Totals;
  targets: Targets | null;
}) {
  const t = useTranslations("dashboard");

  if (!targets) {
    return (
      <div className="rounded-2xl bg-card px-5 py-4">
        <p className="text-sm text-muted-foreground">{t("noGoal")}</p>
      </div>
    );
  }

  const consumed = Math.round(totals.calories);
  const remaining = Math.max(0, targets.target - consumed);
  const pct = Math.min(100, (consumed / targets.target) * 100);
  const over = consumed > targets.target;

  return (
    <div className="rounded-2xl bg-card">
      <div className="p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("calories")}
            </p>
            <p className="mt-1 text-[40px] font-bold leading-none tabular-nums">
              {consumed}
              <span className="ml-1 text-base font-medium text-muted-foreground">
                / {targets.target}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("remaining")}
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold tabular-nums",
                over && "text-destructive",
              )}
            >
              {over ? `+${consumed - targets.target}` : remaining}
            </p>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-foreground/10">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              over ? "bg-destructive" : "bg-foreground",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3">
        <MacroCell
          label={t("protein")}
          value={totals.proteinG}
          target={targets.proteinG}
        />
        <MacroCell
          label={t("carbs")}
          value={totals.carbsG}
          target={targets.carbsG}
          divider
        />
        <MacroCell
          label={t("fat")}
          value={totals.fatG}
          target={targets.fatG}
          divider
        />
      </div>
    </div>
  );
}

function MacroCell({
  label,
  value,
  target,
  divider,
}: {
  label: string;
  value: number;
  target: number;
  divider?: boolean;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div
      className={cn(
        "relative px-4 py-4",
        divider &&
          "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-px before:bg-border",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold tabular-nums">
        {Math.round(value)}
        <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">
          /{target}g
        </span>
      </p>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-foreground/60"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
