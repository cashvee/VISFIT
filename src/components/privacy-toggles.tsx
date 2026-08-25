"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Privacy {
  shareWeeklySummary: boolean;
  shareWeight: boolean;
  shareMeals: boolean;
  shareWater: boolean;
}

export function PrivacyToggles() {
  const t = useTranslations("privacy");
  const [p, setP] = useState<Privacy | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/privacy");
      if (r.ok) {
        const d = (await r.json()) as { privacy: Privacy };
        setP(d.privacy);
      }
    })();
  }, []);

  async function toggle(k: keyof Privacy) {
    if (!p) return;
    const next = { ...p, [k]: !p[k] };
    setP(next);
    await fetch("/api/privacy", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [k]: !p[k] }),
    });
  }

  if (!p) {
    return <div className="rounded-2xl bg-card px-5 py-4 text-sm text-muted-foreground">…</div>;
  }

  const items: Array<{ key: keyof Privacy; label: string }> = [
    { key: "shareWeeklySummary", label: t("weeklySummary") },
    { key: "shareWeight", label: t("weight") },
    { key: "shareMeals", label: t("meals") },
    { key: "shareWater", label: t("water") },
  ];

  return (
    <div className="overflow-hidden rounded-2xl bg-card">
      {items.map((it, i) => (
        <div
          key={it.key}
          className={
            "relative flex items-center justify-between gap-3 px-4 py-3 " +
            (i < items.length - 1
              ? "before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border"
              : "")
          }
        >
          <span className="flex-1 text-[15px]">{it.label}</span>
          <button
            type="button"
            role="switch"
            aria-checked={p[it.key]}
            onClick={() => toggle(it.key)}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors",
              p[it.key] ? "bg-foreground" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 grid h-6 w-6 place-items-center rounded-full bg-background transition-transform",
                p[it.key] ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
