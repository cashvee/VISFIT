"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SectionGroup, RowField } from "@/components/ui/section";
import { Loader2 } from "lucide-react";
import type { User } from "@/db/schema";

interface Targets {
  age: number;
  bmi: number;
  bmiCategory: "underweight" | "normal" | "overweight" | "obese";
  goal: "lose" | "maintain" | "gain";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  weeklyWorkoutCount: number;
  bmr: number;
  tdee: number;
  target: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

function toDateInputValue(v: Date | number | null | undefined) {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  return d.toISOString().slice(0, 10);
}

export function ProfileForm({
  initial,
  initialTargets,
}: {
  initial: User;
  initialTargets: Targets | null;
}) {
  const t = useTranslations("profile");
  const tGoal = useTranslations("goal");
  const tCommon = useTranslations("common");

  const [form, setForm] = useState({
    name: initial.name ?? "",
    username: initial.username ?? "",
    sex: initial.sex ?? "",
    birthYear: initial.birthYear ?? "",
    heightCm: initial.heightCm ?? "",
    weightKg: initial.weightKg ?? "",
    goalType: initial.goalType ?? "",
    targetWeightKg: initial.targetWeightKg ?? "",
    targetDate: toDateInputValue(initial.targetDate),
  });
  const [targets, setTargets] = useState<Targets | null>(initialTargets);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const payload: Record<string, unknown> = {};
    if (form.name) payload.name = form.name;
    if (form.username) payload.username = form.username.toLowerCase();
    if (form.sex) payload.sex = form.sex;
    if (form.birthYear) payload.birthYear = Number(form.birthYear);
    if (form.heightCm) payload.heightCm = Number(form.heightCm);
    if (form.weightKg) payload.weightKg = Number(form.weightKg);
    if (form.goalType) payload.goalType = form.goalType;
    if (form.targetWeightKg) payload.targetWeightKg = Number(form.targetWeightKg);
    if (form.targetDate) {
      payload.targetDate = new Date(form.targetDate + "T00:00:00Z").toISOString();
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Failed");
      }
      const g = await fetch("/api/profile");
      if (g.ok) {
        const data = (await g.json()) as { targets: Targets | null };
        setTargets(data.targets);
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const bmiLabel = targets
    ? targets.bmiCategory === "underweight"
      ? t("bmiUnderweight")
      : targets.bmiCategory === "normal"
        ? t("bmiNormal")
        : targets.bmiCategory === "overweight"
          ? t("bmiOverweight")
          : t("bmiObese")
    : "";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SectionGroup title={tGoal("title")} footer={tGoal("hint")}>
        <RowField label={tGoal("goalType")}>
          <Select
            value={form.goalType}
            onChange={(e) => set("goalType", e.target.value)}
          >
            <option value="">—</option>
            <option value="fat_loss">{tGoal("types.fat_loss")}</option>
            <option value="muscle_gain">{tGoal("types.muscle_gain")}</option>
            <option value="maintenance">{tGoal("types.maintenance")}</option>
            <option value="general_fitness">{tGoal("types.general_fitness")}</option>
            <option value="endurance">{tGoal("types.endurance")}</option>
          </Select>
        </RowField>
        <RowField label={tGoal("targetWeightKg")}>
          <Input
            type="number"
            inputMode="decimal"
            min={20}
            max={400}
            step="0.1"
            value={form.targetWeightKg}
            onChange={(e) => set("targetWeightKg", e.target.value as unknown as number)}
            placeholder="—"
          />
        </RowField>
        <RowField label={tGoal("targetDate")}>
          <input
            type="date"
            value={form.targetDate}
            onChange={(e) => set("targetDate", e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-muted/40 px-3 text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </RowField>
      </SectionGroup>

      <SectionGroup title={t("personal")}>
        <RowField label={t("username")} hint={t("usernameHint")}>
          <Input
            value={form.username}
            onChange={(e) =>
              set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            autoComplete="username"
            placeholder="username"
            minLength={3}
            maxLength={20}
          />
        </RowField>
        <RowField label={t("name")}>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
            placeholder="—"
          />
        </RowField>
        <RowField label={t("sex")}>
          <Select
            value={form.sex}
            onChange={(e) => set("sex", e.target.value as "male" | "female")}
          >
            <option value="">—</option>
            <option value="male">{t("male")}</option>
            <option value="female">{t("female")}</option>
          </Select>
        </RowField>
        <RowField label={t("birthYear")}>
          <Input
            type="number"
            inputMode="numeric"
            min={1900}
            max={new Date().getFullYear()}
            value={form.birthYear}
            onChange={(e) => set("birthYear", e.target.value as unknown as number)}
            placeholder="—"
          />
        </RowField>
        <RowField label={t("heightCm")}>
          <Input
            type="number"
            inputMode="decimal"
            min={50}
            max={260}
            step="0.1"
            value={form.heightCm}
            onChange={(e) => set("heightCm", e.target.value as unknown as number)}
            placeholder="—"
          />
        </RowField>
        <RowField label={t("weightKg")}>
          <Input
            type="number"
            inputMode="decimal"
            min={20}
            max={400}
            step="0.1"
            value={form.weightKg}
            onChange={(e) => set("weightKg", e.target.value as unknown as number)}
            placeholder="—"
          />
        </RowField>
      </SectionGroup>

      {targets && (
        <>
          <SectionGroup title={t("detected")}>
            <DetectedRow
              label={t("bmi")}
              value={`${targets.bmi}`}
              hint={bmiLabel}
            />
            <DetectedRow
              label={t("detectedGoal")}
              value={t(`goals.${targets.goal}`)}
              hint={t("detectedGoalHint", { bmi: targets.bmi })}
            />
            <DetectedRow
              label={t("detectedActivity")}
              value={t(`activityLevels.${targets.activityLevel}`)}
              hint={t("detectedActivityHint", { n: targets.weeklyWorkoutCount })}
            />
          </SectionGroup>

          <SectionGroup title={t("targetCalories")}>
            <div className="grid grid-cols-3 gap-px bg-border">
              <Stat label={t("bmr")} value={targets.bmr} unit={tCommon("kcal")} />
              <Stat label={t("tdee")} value={targets.tdee} unit={tCommon("kcal")} />
              <Stat label={t("targetCalories")} value={targets.target} unit={tCommon("kcal")} highlight />
            </div>
            <div className="grid grid-cols-3 gap-px bg-border">
              <Stat label="P" value={targets.proteinG} unit="g" small />
              <Stat label="C" value={targets.carbsG} unit="g" small />
              <Stat label="F" value={targets.fatG} unit="g" small />
            </div>
          </SectionGroup>
        </>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-destructive/15 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button type="submit" size="lg" disabled={saving} className="w-full">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saved ? t("saved") : t("save")}
      </Button>
    </form>
  );
}

function DetectedRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="relative px-4 py-3.5 before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border last:before:hidden">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[15px]">{label}</span>
        <span className="text-[15px] font-semibold tabular-nums">{value}</span>
      </div>
      {hint && (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  highlight,
  small,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div className="bg-card px-3 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 tabular-nums ${
          highlight ? "text-xl font-bold" : small ? "text-base font-semibold" : "text-lg font-semibold"
        }`}
      >
        {value}
        <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
          {unit}
        </span>
      </p>
    </div>
  );
}
