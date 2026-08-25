import { auth } from "@/auth";
import {
  getMealsBetween,
  getUserById,
  getWeeklyWorkoutCount,
} from "@/db/queries";
import { db } from "@/db/client";
import { waterLogs } from "@/db/schema";
import { and, eq, gte, lt, desc } from "drizzle-orm";
import { fullProfileTargets } from "@/lib/calories";
import { computeGoalProgress } from "@/lib/goal";
import { buildDailySeries, averageCalories } from "@/lib/stats";
import { startOfLocalDay, endOfLocalDay } from "@/lib/utils";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { GoalHero } from "@/components/goal-hero";
import { DailySummary } from "@/components/daily-summary";
import { MealTimeline } from "@/components/meal-timeline";
import { WaterTracker } from "@/components/water-tracker";
import { WeeklyBars } from "@/components/charts/weekly-bars";
import { MacroRing } from "@/components/charts/macro-ring";
import { Button } from "@/components/ui/button";
import { Link, redirect } from "@/i18n/navigation";
import { Dumbbell, Apple } from "lucide-react";

export default async function DashboardPage({
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
  const user = await getUserById(userId);

  const now = new Date();

  // Today
  const fromToday = startOfLocalDay(now).getTime();
  const toToday = endOfLocalDay(now).getTime();
  const mealsToday = await getMealsBetween(userId, fromToday, toToday);

  // Last 7 days (for weekly bars)
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  const fromWeek = startOfLocalDay(weekStart).getTime();
  const mealsWeek = await getMealsBetween(userId, fromWeek, toToday);
  const weekSeries = buildDailySeries(mealsWeek, 7);
  const avg7 = averageCalories(weekSeries);

  // Water today
  const waterRows = await db
    .select()
    .from(waterLogs)
    .where(
      and(
        eq(waterLogs.userId, userId),
        gte(waterLogs.loggedAt, new Date(fromToday)),
        lt(waterLogs.loggedAt, new Date(toToday)),
      ),
    )
    .orderBy(desc(waterLogs.loggedAt));
  const waterTotalMl = waterRows.reduce((s, r) => s + r.amountMl, 0);
  const waterTargetMl = user?.waterTargetMl ?? 2500;

  const totals = mealsToday.reduce(
    (acc, m) => {
      acc.calories += m.totalCalories ?? 0;
      acc.proteinG += m.proteinG ?? 0;
      acc.carbsG += m.carbsG ?? 0;
      acc.fatG += m.fatG ?? 0;
      return acc;
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const weeklyWorkoutCount = user ? await getWeeklyWorkoutCount(user.id) : 0;
  const targets =
    user?.sex && user?.weightKg && user?.heightCm && user?.birthYear
      ? fullProfileTargets({
          sex: user.sex,
          weightKg: user.weightKg,
          heightCm: user.heightCm,
          birthYear: user.birthYear,
          weeklyWorkoutCount,
        })
      : null;

  const goalProgress =
    user?.targetWeightKg && user?.targetDate && user?.weightKg
      ? computeGoalProgress({
          startWeightKg: user.goalStartWeightKg ?? user.weightKg,
          currentWeightKg: user.weightKg,
          targetWeightKg: user.targetWeightKg,
          targetDate: user.targetDate,
          goalSetAt: user.goalSetAt ?? user.createdAt,
        })
      : null;

  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");

  return (
    <div className="space-y-6">
      <header className="space-y-1 px-1">
        <p className="text-[13px] font-medium text-muted-foreground">
          {new Intl.DateTimeFormat("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(now)}
        </p>
        <h1 className="font-display text-4xl uppercase tracking-tight leading-[0.9]">
          {t("today")}
        </h1>
      </header>

      <GoalHero
        sex={user?.sex ?? null}
        goalType={user?.goalType ?? null}
        progress={goalProgress}
      />

      <DailySummary
        totals={totals}
        targets={
          targets
            ? {
                target: targets.target,
                proteinG: targets.proteinG,
                carbsG: targets.carbsG,
                fatG: targets.fatG,
              }
            : null
        }
      />

      {!targets && (
        <Link href="/profile">
          <Button variant="outline" className="w-full">
            {t("completeProfile")}
          </Button>
        </Link>
      )}

      {totals.calories > 0 && (
        <section className="space-y-1.5">
          <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("protein")} / {t("carbs")} / {t("fat")}
          </h2>
          <div className="rounded-2xl bg-card p-4">
            <MacroRing
              proteinG={totals.proteinG}
              carbsG={totals.carbsG}
              fatG={totals.fatG}
              centerValue={`${Math.round(totals.calories)}`}
              centerLabel="kcal"
            />
          </div>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/log"
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-85"
        >
          <Apple className="h-4 w-4" />
          {t("addMeal")}
        </Link>
        <Link
          href="/workouts"
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <Dumbbell className="h-4 w-4" />
          {tNav("workouts")}
        </Link>
      </div>

      <WaterTracker
        initialTotalMl={waterTotalMl}
        targetMl={waterTargetMl}
        initialLastLog={waterRows[0] ?? null}
      />

      <section className="space-y-1.5">
        <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("today")} · 7d
        </h2>
        <WeeklyBars
          series={weekSeries}
          target={targets?.target}
          label={`Avg: ${avg7} kcal`}
        />
      </section>

      <MealTimeline meals={mealsToday} title={t("today")} />
    </div>
  );
}
