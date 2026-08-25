"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionGroup } from "@/components/ui/section";
import { Loader2, Plus, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/db/schema";

const CATEGORY_LABELS: Record<string, string> = {
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  core: "Core",
  arms: "Arms",
  shoulder: "Shoulder",
  cardio: "Cardio",
  fullbody: "Full body",
};

interface PickedEntry {
  exerciseId: string;
  exerciseName: string;
  defaultRest: number;
  sets: number;
  reps: number;
  weightKg: number | null;
}

export function ExercisePicker() {
  const t = useTranslations("workouts");
  const router = useRouter();

  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<PickedEntry[]>([]);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/exercises");
      if (res.ok) {
        const data = (await res.json()) as { exercises: Exercise[] };
        setCatalog(data.exercises);
      }
      setLoading(false);
    })();
  }, []);

  const categories = Array.from(new Set(catalog.map((e) => e.category)));

  const toggle = (e: Exercise) => {
    setPicked((cur) => {
      const idx = cur.findIndex((p) => p.exerciseId === e.id);
      if (idx >= 0) return cur.filter((_, i) => i !== idx);
      return [
        ...cur,
        {
          exerciseId: e.id,
          exerciseName: e.nameEn,
          defaultRest: e.defaultRest,
          sets: 3,
          reps: 10,
          weightKg: e.bodyweight ? null : 20,
        },
      ];
    });
  };

  const update = (i: number, patch: Partial<PickedEntry>) =>
    setPicked((cur) =>
      cur.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    );

  const remove = (i: number) =>
    setPicked((cur) => cur.filter((_, idx) => idx !== i));

  const start = async () => {
    if (picked.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entries: picked.map((p) => ({
            exerciseId: p.exerciseId,
            sets: p.sets,
            reps: p.reps,
            weightKg: p.weightKg,
          })),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Failed");
      }
      const data = (await res.json()) as { session: { id: string } };
      router.push(`/workouts/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {picked.length > 0 && (
        <SectionGroup title={t("setsAndReps")}>
          {picked.map((p, i) => (
            <div
              key={p.exerciseId}
              className="relative px-4 py-3 before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border last:before:hidden"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex-1 truncate text-[15px] font-medium">
                  {p.exerciseName}
                </span>
                <button
                  onClick={() => remove(i)}
                  aria-label="Remove"
                  className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("set")}
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={p.sets}
                    onChange={(e) =>
                      update(i, { sets: Number(e.target.value) || 1 })
                    }
                    className="h-9"
                  />
                </label>
                <label className="block">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("reps")}
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={p.reps}
                    onChange={(e) =>
                      update(i, { reps: Number(e.target.value) || 1 })
                    }
                    className="h-9"
                  />
                </label>
                <label className="block">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("weight")} (kg)
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.5"
                    value={p.weightKg ?? ""}
                    placeholder="Bodyweight"
                    onChange={(e) =>
                      update(i, {
                        weightKg: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="h-9"
                  />
                </label>
              </div>
            </div>
          ))}
        </SectionGroup>
      )}

      <SectionGroup title={t("selectExercises")}>
        {categories.map((cat) => {
          const cExercises = catalog.filter((e) => e.category === cat);
          const isOpen = openCategory === cat;
          const label = CATEGORY_LABELS[cat] ?? cat;
          return (
            <div
              key={cat}
              className="relative before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border last:before:hidden"
            >
              <button
                type="button"
                onClick={() => setOpenCategory(isOpen ? null : cat)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left hover:bg-foreground/[0.03]"
              >
                <span className="text-[15px] font-medium">{label}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && (
                <ul className="bg-background/40">
                  {cExercises.map((e) => {
                    const isPicked = picked.some((p) => p.exerciseId === e.id);
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => toggle(e)}
                          className="flex w-full items-center gap-3 border-t border-border/60 px-6 py-2.5 text-left hover:bg-foreground/[0.04]"
                        >
                          <span
                            className={cn(
                              "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                              isPicked
                                ? "border-foreground bg-foreground text-background"
                                : "border-border",
                            )}
                          >
                            {isPicked && <Plus className="h-3 w-3 rotate-45" />}
                          </span>
                          <span className="text-[14px]">{e.nameEn}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </SectionGroup>

      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-destructive/15 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button
        type="button"
        size="lg"
        onClick={start}
        disabled={picked.length === 0 || submitting}
        className="w-full"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("start")} ({picked.length})
      </Button>
    </div>
  );
}
