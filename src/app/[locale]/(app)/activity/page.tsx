import { auth } from "@/auth";
import { db } from "@/db/client";
import { weightLogs, workoutSessions } from "@/db/schema";
import { getActivities } from "@/db/queries";
import { desc, eq } from "drizzle-orm";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { WeightTracker } from "@/components/weight-tracker";
import { ActivityTracker } from "@/components/activity-tracker";
import { Challenges } from "@/components/challenges";
import { SectionGroup, Row } from "@/components/ui/section";
import { Link, redirect } from "@/i18n/navigation";
import { Activity as ActivityIcon, ExternalLink } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

export default async function ActivityPage({
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

  const [weightRows, workoutRows, activityRows] = await Promise.all([
    db
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, userId))
      .orderBy(desc(weightLogs.loggedAt))
      .limit(200),
    db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(10),
    getActivities(userId, 50),
  ]);

  const t = await getTranslations("activity");

  return (
    <div className="space-y-6">
      <h1 className="px-1 font-display text-4xl uppercase tracking-tight leading-[0.9]">
        {t("title")}
      </h1>

      <section className="space-y-1.5">
        <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("feed")}
        </h2>
        {workoutRows.length === 0 ? (
          <div className="rounded-2xl bg-card px-5 py-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <SectionGroup>
            {workoutRows.map((s) => {
              const started =
                s.startedAt instanceof Date
                  ? s.startedAt
                  : new Date(s.startedAt as unknown as number);
              const durMin = s.totalDurationSec
                ? Math.round(s.totalDurationSec / 60)
                : null;
              return (
                <Row
                  key={s.id}
                  leading={<ActivityIcon className="h-5 w-5" />}
                  label={
                    <Link
                      href={`/workouts/${s.id}`}
                      className="block text-[15px]"
                    >
                      {formatDate(started)}
                    </Link>
                  }
                  sublabel={
                    durMin
                      ? `${formatTime(started)} · ${durMin}m`
                      : formatTime(started)
                  }
                />
              );
            })}
          </SectionGroup>
        )}
      </section>

      <section className="space-y-1.5">
        <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("activities")}
        </h2>
        <ActivityTracker initial={activityRows} />
      </section>

      <WeightTracker initial={weightRows} />

      <section className="space-y-1.5">
        <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("challenges")}
        </h2>
        <Challenges />
      </section>

      <section className="space-y-1.5">
        <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("exploreRoutes")}
        </h2>
        <div className="overflow-hidden rounded-2xl bg-card">
          <p className="px-4 pt-4 text-sm text-muted-foreground">
            {t("exploreRoutesBody")}
          </p>
          <div className="mt-3 aspect-video w-full">
            <iframe
              title="OpenStreetMap"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-0.1278%2C51.5,-0.08%2C51.53&layer=mapnik"
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>
          <a
            href="https://www.openstreetmap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("openOsm")}
          </a>
        </div>
      </section>
    </div>
  );
}
