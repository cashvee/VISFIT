import { auth } from "@/auth";
import { db } from "@/db/client";
import {
  friendships,
  friendPrivacy,
  users,
  workoutSessions,
  weightLogs,
  meals,
} from "@/db/schema";
import { and, desc, eq, gte, isNotNull, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { username } = await params;
  const lower = username.toLowerCase();

  const targetRows = await db
    .select()
    .from(users)
    .where(eq(users.username, lower))
    .limit(1);
  const target = targetRows[0];
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Confirm friendship
  const fs = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(
          and(
            eq(friendships.requesterId, session.user.id),
            eq(friendships.addresseeId, target.id),
          ),
          and(
            eq(friendships.requesterId, target.id),
            eq(friendships.addresseeId, session.user.id),
          ),
        ),
      ),
    )
    .limit(1);
  if (!fs[0]) {
    return NextResponse.json({ error: "Not friends" }, { status: 403 });
  }

  // Privacy
  const pRows = await db
    .select()
    .from(friendPrivacy)
    .where(eq(friendPrivacy.userId, target.id))
    .limit(1);
  const p = pRows[0] ?? {
    shareWeeklySummary: true,
    shareWeight: false,
    shareMeals: false,
    shareWater: false,
  };

  const summary: Record<string, unknown> = {
    user: {
      username: target.username,
      name: target.name,
      image: target.image,
    },
    sharedSince: fs[0].updatedAt,
  };

  if (p.shareWeeklySummary) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const workoutCountRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, target.id),
          isNotNull(workoutSessions.endedAt),
          gte(workoutSessions.startedAt, sevenDaysAgo),
        ),
      );
    summary.weeklyWorkouts = Number(workoutCountRows[0]?.count ?? 0);

    const mealRows = await db
      .select({
        totalCalories: meals.totalCalories,
      })
      .from(meals)
      .where(
        and(eq(meals.userId, target.id), gte(meals.eatenAt, sevenDaysAgo)),
      );
    const totalKcal = mealRows.reduce((s, r) => s + (r.totalCalories ?? 0), 0);
    summary.weeklyAvgCalories =
      mealRows.length > 0 ? Math.round(totalKcal / 7) : 0;
  }

  if (p.shareWeight) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const wRows = await db
      .select()
      .from(weightLogs)
      .where(
        and(
          eq(weightLogs.userId, target.id),
          gte(weightLogs.loggedAt, thirtyDaysAgo),
        ),
      )
      .orderBy(desc(weightLogs.loggedAt));
    const latest = wRows[0]?.weightKg ?? null;
    const oldest = wRows[wRows.length - 1]?.weightKg ?? null;
    summary.weightDelta30d =
      latest !== null && oldest !== null ? Math.round((latest - oldest) * 10) / 10 : null;
    summary.latestWeight = latest;
  }

  return NextResponse.json({ summary });
}
