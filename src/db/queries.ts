import { and, desc, eq, gte, lt, isNotNull, sql } from "drizzle-orm";
import { db } from "./client";
import {
  meals,
  mealItems,
  users,
  dailyGoals,
  workoutSessions,
  goals,
  activities,
  challengeParticipants,
  siteStats,
} from "./schema";
import type { NewMeal, NewMealItem, NewActivity, User } from "./schema";

const VISITOR_COUNT_BASELINE = 30_000;

export async function getUserById(id: string) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function incrementVisitorCount() {
  const [row] = await db
    .insert(siteStats)
    .values({ key: "visitors", value: 1 })
    .onConflictDoUpdate({
      target: siteStats.key,
      set: {
        value: sql`${siteStats.value} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ value: siteStats.value });
  return (row?.value ?? 1) + VISITOR_COUNT_BASELINE;
}

export async function updateUserProfile(
  id: string,
  patch: Partial<
    Pick<
      User,
      | "name"
      | "username"
      | "sex"
      | "birthYear"
      | "heightCm"
      | "weightKg"
      | "activityLevel"
      | "goal"
      | "goalCalorieDelta"
      | "goalType"
      | "goalStartWeightKg"
      | "targetWeightKg"
      | "targetDate"
      | "goalSetAt"
    >
  >,
) {
  await db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, id));
}

export async function createMealWithItems(
  meal: NewMeal,
  items: Omit<NewMealItem, "mealId">[],
) {
  const [created] = await db.insert(meals).values(meal).returning();
  if (items.length > 0) {
    await db
      .insert(mealItems)
      .values(items.map((it) => ({ ...it, mealId: created.id })));
  }
  return created;
}

export async function getMealsBetween(userId: string, fromMs: number, toMs: number) {
  return db
    .select()
    .from(meals)
    .where(
      and(
        eq(meals.userId, userId),
        gte(meals.eatenAt, new Date(fromMs)),
        lt(meals.eatenAt, new Date(toMs)),
      ),
    )
    .orderBy(meals.eatenAt);
}

export async function getMealItems(mealId: string) {
  return db.select().from(mealItems).where(eq(mealItems.mealId, mealId));
}

export async function deleteMeal(userId: string, mealId: string) {
  await db
    .delete(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));
}

export async function getDailyGoal(userId: string, date: string) {
  const rows = await db
    .select()
    .from(dailyGoals)
    .where(and(eq(dailyGoals.userId, userId), eq(dailyGoals.date, date)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getWeeklyWorkoutCount(userId: string): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        gte(workoutSessions.startedAt, sevenDaysAgo),
        isNotNull(workoutSessions.endedAt),
      ),
    );
  return Number(rows[0]?.count ?? 0);
}

// ---------- Goals ----------

export async function getActiveGoal(userId: string) {
  const rows = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.status, "active")))
    .orderBy(desc(goals.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getGoalHistory(userId: string, limit = 20) {
  return db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt))
    .limit(limit);
}

/**
 * Records a new goal in the history table, marking any previously-active
 * goal as replaced. This is additive — the fast-read "current goal" fields
 * on `users` remain the source of truth for dashboard rendering.
 */
export async function recordNewGoal(
  userId: string,
  data: {
    type: NonNullable<User["goalType"]>;
    startingValue: number;
    targetValue: number;
    targetDate: Date;
  },
) {
  await db
    .update(goals)
    .set({ status: "completed", updatedAt: new Date() })
    .where(and(eq(goals.userId, userId), eq(goals.status, "active")));

  const [created] = await db
    .insert(goals)
    .values({
      userId,
      type: data.type,
      startingValue: data.startingValue,
      targetValue: data.targetValue,
      targetDate: data.targetDate,
      status: "active",
    })
    .returning();
  return created;
}

// ---------- Activities ----------

export async function getActivities(userId: string, limit = 50) {
  return db
    .select()
    .from(activities)
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.startedAt))
    .limit(limit);
}

export async function createActivity(activity: NewActivity) {
  const [created] = await db.insert(activities).values(activity).returning();
  return created;
}

export async function deleteActivity(userId: string, id: string) {
  await db
    .delete(activities)
    .where(and(eq(activities.id, id), eq(activities.userId, userId)));
}

// ---------- Challenge participation ----------

export async function getJoinedChallengeSlugs(userId: string): Promise<string[]> {
  const rows = await db
    .select({ slug: challengeParticipants.challengeSlug })
    .from(challengeParticipants)
    .where(eq(challengeParticipants.userId, userId));
  return rows.map((r) => r.slug);
}

export async function joinChallenge(userId: string, slug: string) {
  await db
    .insert(challengeParticipants)
    .values({ userId, challengeSlug: slug })
    .onConflictDoNothing();
}

export async function leaveChallenge(userId: string, slug: string) {
  await db
    .delete(challengeParticipants)
    .where(
      and(
        eq(challengeParticipants.userId, userId),
        eq(challengeParticipants.challengeSlug, slug),
      ),
    );
}
