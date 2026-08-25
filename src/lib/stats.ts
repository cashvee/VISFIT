import type { Meal } from "@/db/schema";
import { dayKey } from "./utils";

export interface DailyTotal {
  date: string; // YYYY-MM-DD (local)
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  count: number;
}

export function groupMealsByDay(meals: Meal[]): Map<string, DailyTotal> {
  const map = new Map<string, DailyTotal>();
  for (const m of meals) {
    const d = m.eatenAt instanceof Date ? m.eatenAt : new Date(m.eatenAt as unknown as number);
    const k = dayKey(d);
    const cur = map.get(k) ?? {
      date: k,
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      count: 0,
    };
    cur.calories += m.totalCalories ?? 0;
    cur.proteinG += m.proteinG ?? 0;
    cur.carbsG += m.carbsG ?? 0;
    cur.fatG += m.fatG ?? 0;
    cur.count += 1;
    map.set(k, cur);
  }
  return map;
}

export function lastNDays(n: number, anchor = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(d.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

export function buildDailySeries(meals: Meal[], days: number): DailyTotal[] {
  const grouped = groupMealsByDay(meals);
  return lastNDays(days).map(
    (date) =>
      grouped.get(date) ?? {
        date,
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        count: 0,
      },
  );
}

export function averageCalories(series: DailyTotal[]): number {
  const withMeals = series.filter((d) => d.count > 0);
  if (withMeals.length === 0) return 0;
  return Math.round(
    withMeals.reduce((s, d) => s + d.calories, 0) / withMeals.length,
  );
}
