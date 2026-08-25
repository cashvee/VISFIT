"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { BodySilhouette } from "@/components/body-silhouette";
import type { GoalProgress, GoalType } from "@/lib/goal";
import { ArrowRight } from "lucide-react";

export function GoalHero({
  sex,
  goalType,
  progress,
}: {
  sex: "male" | "female" | null;
  goalType: GoalType | null;
  progress: GoalProgress | null;
}) {
  const t = useTranslations("goal");

  if (!progress) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
        <div className="grid items-center gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_150px] sm:p-6">
          <div className="min-w-0">
            <p className="font-display text-2xl uppercase leading-[0.9] tracking-tight">
              {t("noGoalTitle")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("noGoalBody")}
            </p>
            <Link href="/profile" className="mt-4 inline-block">
              <Button
                size="sm"
                className="bg-signal text-signal-foreground hover:bg-signal/85"
              >
                {t("setGoal")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <BodySilhouette
            sex={sex}
            progressPct={0}
            className="mx-auto h-56 w-28 text-foreground sm:h-64"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
      <div className="grid items-center gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_150px] sm:p-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {goalType ? t(`types.${goalType}`) : t("types.general_fitness")}
          </p>
          <p className="mt-1 font-display text-5xl leading-[0.85] tracking-tight tabular-nums">
            {progress.isPastDue ? 0 : progress.daysRemaining}
          </p>
          <p className="font-display text-lg uppercase tracking-wide text-muted-foreground">
            {t("daysToGo")}
          </p>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-signal transition-all"
              style={{ width: `${progress.progressPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {progress.currentWeightKg.toFixed(1)} kg →{" "}
              {progress.targetWeightKg.toFixed(1)} kg
            </span>
            <span className="font-semibold text-foreground">
              {progress.progressPct}%
            </span>
          </div>
        </div>
        <BodySilhouette
          sex={sex}
          progressPct={progress.progressPct}
          className="mx-auto h-64 w-32 text-foreground sm:h-72"
        />
      </div>

      <Link
        href="/profile"
        className="block border-t border-border px-5 py-3 text-center text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {t("adjustGoal")}
      </Link>
    </div>
  );
}
