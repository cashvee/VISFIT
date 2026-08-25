export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type Goal = "lose" | "maintain" | "gain";
export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_DELTA: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export function calculateBMR(opts: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { sex, weightKg, heightCm, age } = opts;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, level: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIER[level];
}

export function calculateTarget(tdee: number, goal: Goal): number {
  return Math.max(1200, Math.round(tdee + GOAL_DELTA[goal]));
}

export function ageFromBirthYear(birthYear: number, today = new Date()): number {
  return Math.max(0, today.getFullYear() - birthYear);
}

export function macroSplit(targetKcal: number) {
  const proteinKcal = targetKcal * 0.3;
  const carbsKcal = targetKcal * 0.4;
  const fatKcal = targetKcal * 0.3;
  return {
    proteinG: Math.round(proteinKcal / 4),
    carbsG: Math.round(carbsKcal / 4),
    fatG: Math.round(fatKcal / 9),
  };
}

// ---------- Auto-detection helpers ----------

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(b: number): BmiCategory {
  if (b < 18.5) return "underweight";
  if (b < 25) return "normal";
  if (b < 30) return "overweight";
  return "obese";
}

export function goalFromBmi(b: number): Goal {
  if (b < 18.5) return "gain";
  if (b >= 25) return "lose";
  return "maintain";
}

export function activityFromWeeklyWorkouts(n: number): ActivityLevel {
  if (n <= 0) return "sedentary";
  if (n <= 2) return "light";
  if (n <= 4) return "moderate";
  if (n <= 6) return "active";
  return "very_active";
}

export function fullProfileTargets(profile: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  birthYear: number;
  weeklyWorkoutCount: number;
}) {
  const age = ageFromBirthYear(profile.birthYear);
  const bmiValue = bmi(profile.weightKg, profile.heightCm);
  const goal = goalFromBmi(bmiValue);
  const activityLevel = activityFromWeeklyWorkouts(profile.weeklyWorkoutCount);

  const bmrValue = calculateBMR({
    sex: profile.sex,
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    age,
  });
  const tdee = calculateTDEE(bmrValue, activityLevel);
  const target = calculateTarget(tdee, goal);
  const macros = macroSplit(target);

  return {
    age,
    bmi: Math.round(bmiValue * 10) / 10,
    bmiCategory: bmiCategory(bmiValue),
    goal,
    activityLevel,
    weeklyWorkoutCount: profile.weeklyWorkoutCount,
    bmr: Math.round(bmrValue),
    tdee: Math.round(tdee),
    target,
    ...macros,
  };
}
