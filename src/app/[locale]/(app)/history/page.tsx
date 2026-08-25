import { auth } from "@/auth";
import { db } from "@/db/client";
import { meals as mealsTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { SectionGroup, Row } from "@/components/ui/section";
import { formatTime, dayKey } from "@/lib/utils";
import { buildDailySeries, averageCalories } from "@/lib/stats";
import { WeeklyBars } from "@/components/charts/weekly-bars";
import { Button } from "@/components/ui/button";
import { Link, redirect } from "@/i18n/navigation";
import { Plus } from "lucide-react";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect({ href: "/signin", locale });
    return null;
  }

  const rows = await db
    .select()
    .from(mealsTable)
    .where(eq(mealsTable.userId, userId))
    .orderBy(desc(mealsTable.eatenAt))
    .limit(500);

  const t = await getTranslations("history");
  const tCommon = await getTranslations("common");
  const tDashboard = await getTranslations("dashboard");

  // Build 14-day stats series (chronological, oldest first)
  const series14 = buildDailySeries(rows, 14);
  const avg14 = averageCalories(series14);
  const loggedDays = series14.filter((d) => d.count > 0).length;
  const totalKcal = series14.reduce((s, d) => s + d.calories, 0);

  // Group by local day for listing
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const eaten =
      r.eatenAt instanceof Date
        ? r.eatenAt
        : new Date(r.eatenAt as unknown as number);
    const k = dayKey(eaten);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }

  const dayFmt = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const hero = (
    <h1 className="px-1 font-display text-4xl uppercase tracking-tight leading-[0.9]">
      {t("title")}
    </h1>
  );

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        {hero}
        <Link href="/log" className="block">
          <Button size="lg" className="w-full">
            <Plus className="h-5 w-5" />
            {tDashboard("addMeal")}
          </Button>
        </Link>
        <div className="rounded-2xl bg-card px-5 py-6 text-center text-sm text-muted-foreground">
          {t("noData")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hero}
      <Link href="/log" className="block">
        <Button size="lg" className="w-full">
          <Plus className="h-5 w-5" />
          {tDashboard("addMeal")}
        </Button>
      </Link>

      <section className="space-y-1.5">
        <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Last 14 Days
        </h2>
        <WeeklyBars series={series14} label={`Average: ${avg14} kcal`} />
      </section>

      <div className="grid grid-cols-3 gap-px rounded-2xl bg-border overflow-hidden">
        <StatCell label="Average" value={`${avg14}`} unit={tCommon("kcal")} />
        <StatCell label="Days" value={`${loggedDays}`} unit="/14" />
        <StatCell
          label="Total"
          value={`${Math.round(totalKcal / 1000)}k`}
          unit={tCommon("kcal")}
        />
      </div>

      {Array.from(groups.entries()).map(([k, items]) => {
        const dayDate = new Date(items[0].eatenAt as unknown as number);
        const total = items.reduce((s, m) => s + (m.totalCalories ?? 0), 0);
        return (
          <SectionGroup
            key={k}
            title={dayFmt.format(dayDate)}
            footer={`${Math.round(total)} ${tCommon("kcal")}`}
          >
            {items.map((m) => {
              const eaten =
                m.eatenAt instanceof Date
                  ? m.eatenAt
                  : new Date(m.eatenAt as unknown as number);
              return (
                <Row
                  key={m.id}
                  leading={
                    <span className="text-[13px] font-semibold tabular-nums text-foreground">
                      {formatTime(eaten)}
                    </span>
                  }
                  label={m.rawText}
                  value={`${Math.round(m.totalCalories)}`}
                />
              );
            })}
          </SectionGroup>
        );
      })}
    </div>
  );
}

function StatCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="bg-card px-3 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums">
        {value}
        <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
          {unit}
        </span>
      </p>
    </div>
  );
}
