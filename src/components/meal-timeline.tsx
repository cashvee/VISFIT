"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SectionGroup } from "@/components/ui/section";
import { formatTime } from "@/lib/utils";
import type { Meal } from "@/db/schema";
import { Trash2, ChevronRight } from "lucide-react";
import { useState, useTransition } from "react";

export function MealTimeline({
  meals: initial,
  title,
}: {
  meals: Meal[];
  title?: string;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [meals, setMeals] = useState(initial);
  const [pending, startTransition] = useTransition();

  if (meals.length === 0) {
    return (
      <div className="rounded-2xl bg-card px-5 py-6 text-center">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  const onDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await fetch(`/api/meals/${id}`, { method: "DELETE" });
      if (res.ok) setMeals((m) => m.filter((x) => x.id !== id));
    });
  };

  return (
    <SectionGroup title={title}>
      {meals.map((m, i) => {
        const eaten =
          m.eatenAt instanceof Date
            ? m.eatenAt
            : new Date(m.eatenAt as unknown as number);
        const isLast = i === meals.length - 1;
        return (
          <div
            key={m.id}
            className={
              "relative " +
              (!isLast
                ? "before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border"
                : "")
            }
          >
            <Link
              href={`/meals/${m.id}/edit`}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.06]"
            >
              <span className="flex h-9 w-12 shrink-0 items-center justify-center text-[13px] font-semibold tabular-nums">
                {formatTime(eaten)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px]">{m.rawText}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {Math.round(m.totalCalories)} {tCommon("kcal")} · P{" "}
                  {Math.round(m.proteinG)} · C {Math.round(m.carbsG)} · F{" "}
                  {Math.round(m.fatG)}
                </span>
              </span>
              <button
                type="button"
                onClick={(e) => onDelete(e, m.id)}
                disabled={pending}
                aria-label={tCommon("delete")}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            </Link>
          </div>
        );
      })}
    </SectionGroup>
  );
}
