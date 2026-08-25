"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { Loader2, Search, Plus } from "lucide-react";
import type { UsdaFood } from "@/lib/usda";

export function UsdaFoodSearch({ onAdd }: { onAdd: (food: UsdaFood) => void }) {
  const t = useTranslations("nutrition");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UsdaFood[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { results: UsdaFood[] };
      setResults(data.results);
    } catch {
      setError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("searchTitle")}
      </p>
      <form onSubmit={onSearch} className="mt-2 flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
        />
        <Button type="submit" size="icon" disabled={loading} aria-label={t("searchButton")}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-destructive">{t("searchError")}</p>
      )}

      {!error && results && results.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">{t("noResults")}</p>
      )}

      {results && results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.map((f) => (
            <li
              key={f.fdcId}
              className="flex items-center gap-3 rounded-xl border border-border p-2"
            >
              <SmartImage
                query={`${f.name} food`}
                orientation="square"
                alt={f.name}
                className="h-12 w-12 shrink-0 rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {f.calories} kcal · P{f.proteinG} C{f.carbsG} F{f.fatG} · {t("per100g")}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  {t("source")}
                </p>
              </div>
              <button
                type="button"
                aria-label={t("addToLog")}
                onClick={() => onAdd(f)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
