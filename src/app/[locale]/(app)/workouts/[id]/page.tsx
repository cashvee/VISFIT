import { auth } from "@/auth";
import { db } from "@/db/client";
import { workoutSessions, workoutEntries, exercises } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  IntervalTimer,
  type TimerEntry,
} from "@/components/workout/interval-timer";
import { formatDate, formatTime } from "@/lib/utils";
import { redirect } from "@/i18n/navigation";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect({ href: "/signin", locale });
    return null;
  }
  const rows = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)))
    .limit(1);
  const ws = rows[0];
  if (!ws) notFound();

  const joinedEntries = await db
    .select({
      entry: workoutEntries,
      exercise: exercises,
    })
    .from(workoutEntries)
    .leftJoin(exercises, eq(workoutEntries.exerciseId, exercises.id))
    .where(eq(workoutEntries.sessionId, id))
    .orderBy(workoutEntries.orderIdx);

  const startedAt =
    ws.startedAt instanceof Date
      ? ws.startedAt
      : new Date(ws.startedAt as unknown as number);

  const t = await getTranslations("workouts");

  // If finished, show summary
  if (ws.endedAt) {
    const durMin = ws.totalDurationSec
      ? Math.round(ws.totalDurationSec / 60)
      : 0;
    return (
      <div className="space-y-6">
        <header className="space-y-1 px-1">
          <p className="text-[13px] font-medium text-muted-foreground">
            {formatDate(startedAt)} · {formatTime(startedAt)}
          </p>
          <h1 className="text-[34px] font-bold tracking-tight leading-tight">
            {durMin}m
          </h1>
        </header>
        <div className="rounded-2xl bg-card p-4">
          <ul className="space-y-3">
            {joinedEntries.map((j) => (
              <li
                key={j.entry.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="truncate text-[15px]">
                  {j.exercise?.nameEn}
                </span>
                <span className="text-sm text-muted-foreground">
                  {j.entry.sets} × {j.entry.reps ?? "—"}
                  {j.entry.weightKg != null ? ` · ${j.entry.weightKg} kg` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Active session — show timer
  const timerEntries: TimerEntry[] = joinedEntries.map((j) => ({
    id: j.entry.id,
    exerciseName: j.exercise?.nameEn ?? "—",
    sets: j.entry.sets,
    reps: j.entry.reps,
    weightKg: j.entry.weightKg,
    restSec: j.exercise?.defaultRest ?? 60,
  }));

  return (
    <div className="space-y-6">
      <header className="px-1">
        <p className="text-[13px] font-medium text-muted-foreground">
          {formatTime(startedAt)}
        </p>
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {t("title")}
        </h1>
      </header>
      <IntervalTimer
        sessionId={id}
        entries={timerEntries}
        startedAtMs={startedAt.getTime()}
      />
    </div>
  );
}
