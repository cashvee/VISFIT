export type GoalType =
  | "fat_loss"
  | "muscle_gain"
  | "maintenance"
  | "general_fitness"
  | "endurance";

export interface GoalProgress {
  startWeightKg: number;
  currentWeightKg: number;
  targetWeightKg: number;
  diffKg: number; // remaining change needed (signed)
  progressPct: number; // 0-100, clamped
  daysRemaining: number; // 0 if past due
  isPastDue: boolean;
  totalDays: number;
}

/**
 * Computes progress toward a weight-based goal. Pure function, no I/O —
 * safe to call on both server and client.
 */
export function computeGoalProgress(opts: {
  startWeightKg: number;
  currentWeightKg: number;
  targetWeightKg: number;
  targetDate: Date;
  goalSetAt: Date;
  now?: Date;
}): GoalProgress {
  const now = opts.now ?? new Date();
  const totalChange = opts.targetWeightKg - opts.startWeightKg;
  const achievedChange = opts.currentWeightKg - opts.startWeightKg;

  let progressPct: number;
  if (Math.abs(totalChange) < 0.05) {
    // Maintenance-style goal: progress reflects how close current is to target.
    const drift = Math.abs(opts.currentWeightKg - opts.targetWeightKg);
    progressPct = Math.max(0, 100 - drift * 20);
  } else {
    progressPct = (achievedChange / totalChange) * 100;
  }
  progressPct = Math.min(100, Math.max(0, Math.round(progressPct)));

  const msRemaining = opts.targetDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / 86_400_000));
  const totalDays = Math.max(
    1,
    Math.ceil((opts.targetDate.getTime() - opts.goalSetAt.getTime()) / 86_400_000),
  );

  return {
    startWeightKg: opts.startWeightKg,
    currentWeightKg: opts.currentWeightKg,
    targetWeightKg: opts.targetWeightKg,
    diffKg: Math.round((opts.targetWeightKg - opts.currentWeightKg) * 10) / 10,
    progressPct,
    daysRemaining,
    isPastDue: msRemaining < 0,
    totalDays,
  };
}
