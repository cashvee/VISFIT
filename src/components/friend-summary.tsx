"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { SectionGroup } from "@/components/ui/section";
import { Loader2 } from "lucide-react";

interface Summary {
  user: { username: string; name: string | null; image: string | null };
  sharedSince: number;
  weeklyWorkouts?: number;
  weeklyAvgCalories?: number;
  weightDelta30d?: number | null;
  latestWeight?: number | null;
}

export function FriendSummary({ username }: { username: string }) {
  const t = useTranslations("friends");
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/users/${username}/summary`);
      if (r.ok) {
        const d = (await r.json()) as { summary: Summary };
        setData(d.summary);
      } else {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Failed");
      }
      setLoading(false);
    })();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="rounded-2xl bg-destructive/15 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <SectionGroup title={t("weeklySummary")}>
        {typeof data.weeklyWorkouts === "number" ? (
          <Row label={t("weeklyWorkouts")} value={`${data.weeklyWorkouts}`} />
        ) : null}
        {typeof data.weeklyAvgCalories === "number" ? (
          <Row label={t("avgCalories")} value={`${data.weeklyAvgCalories} kcal`} last />
        ) : null}
      </SectionGroup>

      {typeof data.weightDelta30d === "number" && (
        <SectionGroup title={t("weight")}>
          {data.latestWeight && (
            <Row label={t("currentWeight")} value={`${data.latestWeight.toFixed(1)} kg`} />
          )}
          <Row
            label={t("monthlyDelta")}
            value={`${data.weightDelta30d > 0 ? "+" : ""}${data.weightDelta30d.toFixed(1)} kg`}
            last
          />
        </SectionGroup>
      )}

      {data.weeklyWorkouts === undefined && data.weightDelta30d === null && (
        <div className="rounded-2xl bg-card px-5 py-6 text-center text-sm text-muted-foreground">
          {t("nothingShared")}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={
        "relative flex items-center justify-between gap-3 px-4 py-3.5 " +
        (!last
          ? "before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border"
          : "")
      }
    >
      <span className="text-[15px]">{label}</span>
      <span className="text-[15px] font-semibold tabular-nums">{value}</span>
    </div>
  );
}
