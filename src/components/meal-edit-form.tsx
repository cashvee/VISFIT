"use client";

import { useRouter } from "@/i18n/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SectionGroup, RowField } from "@/components/ui/section";
// Note: native date/time inputs use plain <input> with custom styling for picker UX
import { Loader2, Trash2 } from "lucide-react";
import type { Meal } from "@/db/schema";

function toTimeInput(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MealEditForm({ initial }: { initial: Meal }) {
  const router = useRouter();
  const initialDate =
    initial.eatenAt instanceof Date
      ? initial.eatenAt
      : new Date(initial.eatenAt as unknown as number);

  const [rawText, setRawText] = useState(initial.rawText);
  const [time, setTime] = useState(toTimeInput(initialDate));
  const [date, setDate] = useState(toDateInput(initialDate));
  const [calories, setCalories] = useState(String(Math.round(initial.totalCalories)));
  const [proteinG, setProteinG] = useState(String(Math.round(initial.proteinG)));
  const [carbsG, setCarbsG] = useState(String(Math.round(initial.carbsG)));
  const [fatG, setFatG] = useState(String(Math.round(initial.fatG)));

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const [hh, mm] = time.split(":").map(Number);
    const [yyyy, mo, dd] = date.split("-").map(Number);
    const eatenAt = new Date(yyyy, mo - 1, dd, hh, mm, 0, 0);

    try {
      const res = await fetch(`/api/meals/${initial.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rawText: rawText.trim(),
          eatenAt: eatenAt.toISOString(),
          totalCalories: Number(calories) || 0,
          proteinG: Number(proteinG) || 0,
          carbsG: Number(carbsG) || 0,
          fatG: Number(fatG) || 0,
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
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this meal?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/meals/${initial.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <SectionGroup title="Description">
        <div className="px-4 py-3">
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            required
            minLength={2}
            rows={4}
          />
        </div>
      </SectionGroup>

      <SectionGroup title="Time">
        <RowField label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="h-10 w-full cursor-pointer rounded-lg border border-border bg-muted/40 px-3 text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </RowField>
        <RowField label="Time">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="h-10 w-full max-w-[10rem] cursor-pointer rounded-lg border border-border bg-muted/40 px-3 text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </RowField>
      </SectionGroup>

      <SectionGroup title="Nutrition" footer="Adjust the values manually if needed.">
        <RowField label="Calories (kcal)">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
        </RowField>
        <RowField label="Protein (g)">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={proteinG}
            onChange={(e) => setProteinG(e.target.value)}
          />
        </RowField>
        <RowField label="Carbs (g)">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={carbsG}
            onChange={(e) => setCarbsG(e.target.value)}
          />
        </RowField>
        <RowField label="Fat (g)">
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
        Save
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="lg"
        disabled={deleting}
        onClick={onDelete}
        className="w-full text-destructive hover:text-destructive"
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Delete
      </Button>
    </form>
  );
}
