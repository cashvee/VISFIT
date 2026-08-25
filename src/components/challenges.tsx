"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SmartImage } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const CHALLENGES = [
  { id: "run5k", key: "run5k", descKey: "run5kDesc", query: "runner outdoor training" },
  { id: "strength30", key: "strength30", descKey: "strength30Desc", query: "strength training modern gym" },
  { id: "cycling", key: "cycling", descKey: "cyclingDesc", query: "cycling mountain road" },
  { id: "consistency", key: "consistency", descKey: "consistencyDesc", query: "fitness lifestyle athlete" },
  { id: "eating", key: "eating", descKey: "eatingDesc", query: "healthy meal high protein" },
] as const;

export function Challenges() {
  const t = useTranslations("challenges");
  const tActivity = useTranslations("activity");
  const [joined, setJoined] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/challenges")
      .then((res) => (res.ok ? res.json() : { joined: [] }))
      .then((data: { joined: string[] }) => {
        if (!cancelled) setJoined(data.joined ?? []);
      })
      .catch(() => {
        // stay empty — challenges are still viewable, just not marked joined
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(id: string) {
    const isJoined = joined.includes(id);
    setPending(id);
    try {
      if (isJoined) {
        await fetch(`/api/challenges?slug=${encodeURIComponent(id)}`, { method: "DELETE" });
        setJoined((prev) => prev.filter((x) => x !== id));
      } else {
        await fetch("/api/challenges", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug: id }),
        });
        setJoined((prev) => [...prev, id]);
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CHALLENGES.map((c) => {
        const isJoined = joined.includes(c.id);
        return (
          <div key={c.id} className="overflow-hidden rounded-2xl bg-card">
            <SmartImage
              query={c.query}
              orientation="landscape"
              alt={t(c.key)}
              className="h-28 w-full"
            />
            <div className="p-4">
              <p className="text-[15px] font-semibold">{t(c.key)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t(c.descKey)}</p>
              <Button
                type="button"
                size="sm"
                variant={isJoined ? "secondary" : "default"}
                disabled={pending === c.id}
                onClick={() => toggle(c.id)}
                className="mt-3 w-full"
              >
                {isJoined && <Check className="h-4 w-4" />}
                {isJoined ? tActivity("joined") : tActivity("join")}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
