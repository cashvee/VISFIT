import { auth } from "@/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { getUserById, getWeeklyWorkoutCount, updateUserProfile, recordNewGoal } from "@/db/queries";
import { fullProfileTargets } from "@/lib/calories";
import { computeGoalProgress } from "@/lib/goal";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const ProfilePatch = z.object({
  name: z.string().min(1).max(80).optional(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and underscore only")
    .optional(),
  sex: z.enum(["male", "female"]).optional(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  heightCm: z.number().min(50).max(260).optional(),
  weightKg: z.number().min(20).max(400).optional(),
  // goal, activityLevel, goalCalorieDelta are now derived — accept silently but ignore.
  goalType: z
    .enum(["fat_loss", "muscle_gain", "maintenance", "general_fitness", "endurance"])
    .optional(),
  targetWeightKg: z.number().min(20).max(400).optional(),
  targetDate: z.string().datetime().optional(),
});

function goalProgressFor(user: NonNullable<Awaited<ReturnType<typeof getUserById>>>) {
  if (!user.targetWeightKg || !user.targetDate || !user.weightKg) return null;
  return computeGoalProgress({
    startWeightKg: user.goalStartWeightKg ?? user.weightKg,
    currentWeightKg: user.weightKg,
    targetWeightKg: user.targetWeightKg,
    targetDate: user.targetDate,
    goalSetAt: user.goalSetAt ?? user.createdAt,
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let targets: ReturnType<typeof fullProfileTargets> | null = null;
  if (user.sex && user.weightKg && user.heightCm && user.birthYear) {
    const weeklyWorkoutCount = await getWeeklyWorkoutCount(user.id);
    targets = fullProfileTargets({
      sex: user.sex,
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      birthYear: user.birthYear,
      weeklyWorkoutCount,
    });
  }

  return NextResponse.json({ user, targets, goalProgress: goalProgressFor(user) });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = ProfilePatch.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body", details: body.error.format() }, { status: 400 });
  }
  // username uniqueness check
  if (body.data.username) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, body.data.username), ne(users.id, session.user.id)))
      .limit(1);
    if (existing[0]) {
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 409 },
      );
    }
  }

  const patch: Record<string, unknown> = { ...body.data };
  if (body.data.targetDate) {
    patch.targetDate = new Date(body.data.targetDate);
  }

  const existing = await getUserById(session.user.id);
  let isNewGoal = false;
  if (body.data.targetWeightKg !== undefined) {
    if (existing && !existing.goalStartWeightKg && existing.weightKg) {
      patch.goalStartWeightKg = existing.weightKg;
      patch.goalSetAt = new Date();
    }
  }

  // Detect an actual new/changed goal (not just any profile edit) to record
  // in goal history — the `users` row stays the fast-read "current goal".
  if (existing) {
    const effectiveType = (body.data.goalType ?? existing.goalType) ?? null;
    const effectiveTarget = body.data.targetWeightKg ?? existing.targetWeightKg ?? null;
    const effectiveDate = (patch.targetDate as Date | undefined) ?? existing.targetDate ?? null;
    const changed =
      effectiveType !== existing.goalType ||
      effectiveTarget !== existing.targetWeightKg ||
      (effectiveDate?.getTime() ?? null) !== (existing.targetDate?.getTime() ?? null);
    if (effectiveType && effectiveTarget && effectiveDate && changed) {
      isNewGoal = true;
    }
  }

  await updateUserProfile(
    session.user.id,
    patch as Parameters<typeof updateUserProfile>[1],
  );
  const user = await getUserById(session.user.id);

  if (isNewGoal && user?.goalType && user.targetWeightKg && user.targetDate) {
    await recordNewGoal(session.user.id, {
      type: user.goalType,
      startingValue: user.goalStartWeightKg ?? user.weightKg ?? user.targetWeightKg,
      targetValue: user.targetWeightKg,
      targetDate: user.targetDate,
    });
  }

  return NextResponse.json({ user, goalProgress: user ? goalProgressFor(user) : null });
}
