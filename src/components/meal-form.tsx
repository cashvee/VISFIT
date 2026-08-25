"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SectionGroup, RowField } from "@/components/ui/section";
import { UsdaFoodSearch } from "@/components/usda-food-search";
import { Loader2, X } from "lucide-react";
import type { UsdaFood } from "@/lib/usda";

interface AddedItem extends UsdaFood {
  key: string;
}

function nowTimeValue() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function MealForm() {
  const t = useTranslations("log");
  const router = useRouter();

  const [text, setText] = useState("");
  const [time, setTime] = useState(nowTimeValue());
  const [items, setItems] = useState<AddedItem[]>([]);
  const [calories, setCalories] = useState("0");
  const [proteinG, setProteinG] = useState("0");
  const [carbsG, setCarbsG] = useState("0");
  const [fatG, setFatG] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFood(food: UsdaFood) {
    setItems((prev) => [...prev, { ...food, key: crypto.randomUUID() }]);
    setText((prev) =>
      prev ? `${prev}, ${food.servingSize} ${food.name.toLowerCase()}` : `${food.servingSize} ${food.name}`,
    );
    setCalories((c) => String(Math.round(Number(c || 0) + food.calories)));
    setProteinG((p) => String(Math.round(Number(p || 0) + food.proteinG)));
    setCarbsG((c) => String(Math.round(Number(c || 0) + food.carbsG)));
    setFatG((f) => String(Math.round(Number(f || 0) + food.fatG)));
  }

  function removeItem(key: string) {
    const item = items.find((i) => i.key === key);
    if (!item) return;
    setItems((prev) => prev.filter((i) => i.key !== key));
    setCalories((c) => String(Math.max(0, Math.round(Number(c || 0) - item.calories))));
    setProteinG((p) => String(Math.max(0, Math.round(Number(p || 0) - item.proteinG))));
    setCarbsG((c) => String(Math.max(0, Math.round(Number(c || 0) - item.carbsG))));
    setFatG((f) => String(Math.max(0, Math.round(Number(f || 0) - item.fatG))));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const [hh, mm] = time.split(":").map(Number);
    const eatenAt = new Date();
    eatenAt.setHours(hh, mm, 0, 0);

    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rawText: text.trim(),
          eatenAt: eatenAt.toISOString(),
          totalCalories: Number(calories) || 0,
          proteinG: Number(proteinG) || 0,
          carbsG: Number(carbsG) || 0,
          fatG: Number(fatG) || 0,
          items: items.map((it) => ({
            name: it.name,
            quantity: null,
            unit: it.servingSize,
            calories: it.calories,
            proteinG: it.proteinG,
            carbsG: it.carbsG,
            fatG: it.fatG,
            externalFoodId: String(it.fdcId),
          })),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Failed");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <UsdaFoodSearch onAdd={addFood} />

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li
              key={it.key}
              className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-[13px]"
            >
              <span className="min-w-0 flex-1 truncate">{it.name}</span>
              <span className="shrink-0 text-muted-foreground">{it.calories} kcal</span>
              <button
                type="button"
                onClick={() => removeItem(it.key)}
                aria-label="Remove"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <SectionGroup title={t("descriptionTitle")} footer={t("subtitle")}>
        <div className="px-4 py-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("placeholder")}
            required
            minLength={2}
            rows={4}
          />
        </div>
      </SectionGroup>

      <SectionGroup title={t("nutritionTitle")} footer={t("nutritionHint")}>
        <RowField label={t("calories")}>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
        </RowField>
        <RowField label={t("protein")}>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={proteinG}
            onChange={(e) => setProteinG(e.target.value)}
          />
        </RowField>
        <RowField label={t("carbs")}>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={carbsG}
            onChange={(e) => setCarbsG(e.target.value)}
          />
        </RowField>
        <RowField label={t("fat")}>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={fatG}
            onChange={(e) => setFatG(e.target.value)}
          />
        </RowField>
      </SectionGroup>

      <SectionGroup>
        <RowField label={t("time")}>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="h-10 w-full max-w-[10rem] cursor-pointer rounded-lg border border-border bg-muted/40 px-3 text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={() => setTime(nowTimeValue())}
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              {t("now")}
            </button>
          </div>
        </RowField>
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
        type="submit"
        size="lg"
        disabled={submitting || text.trim().length < 2}
        className="w-full"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? t("saving") : t("submit")}
      </Button>
    </form>
  );
}
