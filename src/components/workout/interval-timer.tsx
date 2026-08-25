"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Pause, Play, SkipForward, Check, Square } from "lucide-react";

export interface TimerEntry {
  id: string;
  exerciseName: string;
  sets: number;
  reps: number | null;
  restSec: number;
}

interface Props {
  sessionId: string;
  entries: TimerEntry[];
  startedAtMs: number;
}

type Phase = "work" | "rest" | "done";

export function IntervalTimer({ sessionId, entries, startedAtMs }: Props) {
  const t = useTranslations("workouts");
  const router = useRouter();

  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0); // current set index for current exercise
  const [phase, setPhase] = useState<Phase>("work");
  const [remaining, setRemaining] = useState(0); // seconds in rest
  const [running, setRunning] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const ex = entries[exIdx];
  const totalSets = ex?.sets ?? 0;

  // Wake lock to keep screen on
  useEffect(() => {
    let wakeLock: { release: () => Promise<void> } | null = null;
    (async () => {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: {
            request: (
              type: string,
            ) => Promise<{ release: () => Promise<void> }>;
          };
        };
        wakeLock = (await nav.wakeLock?.request?.("screen")) ?? null;
      } catch {}
    })();
    return () => {
      wakeLock?.release?.().catch(() => {});
    };
  }, []);

  // Rest countdown
  useEffect(() => {
    if (phase !== "rest" || !running) return;
    if (remaining <= 0) {
      // rest done → next set or next exercise
      advanceAfterRest();
      return;
    }
    const id = setInterval(() => {
      setRemaining((r) => {
        const next = r - 1;
        if (next <= 3 && next > 0) beep(880);
        if (next === 0) beep(1320, 0.4);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, running, remaining]);

  function beep(freq = 880, dur = 0.15) {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        )();
      }
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.type = "sine";
      g.gain.value = 0.15;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    } catch {}
  }

  function completeSet() {
    if (!ex) return;
    const isLastSet = setIdx + 1 >= totalSets;
    const isLastExercise = exIdx + 1 >= entries.length;
    if (isLastSet && isLastExercise) {
      // All done
      setPhase("done");
      setRunning(false);
      return;
    }
    // Start rest
    setRemaining(ex.restSec);
    setPhase("rest");
    setRunning(true);
  }

  function advanceAfterRest() {
    const isLastSet = setIdx + 1 >= totalSets;
    if (isLastSet) {
      setExIdx((i) => i + 1);
      setSetIdx(0);
    } else {
      setSetIdx((i) => i + 1);
    }
    setPhase("work");
    setRunning(false);
    setRemaining(0);
  }

  function skipRest() {
    setRemaining(0);
    advanceAfterRest();
  }

  async function finish() {
    setFinishing(true);
    const durSec = Math.round((Date.now() - startedAtMs) / 1000);
    await fetch(`/api/workouts/${sessionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        endedAt: new Date().toISOString(),
        totalDurationSec: durSec,
      }),
    });
    router.push("/workouts");
    router.refresh();
  }

  if (phase === "done") {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-2xl bg-card px-6 py-8">
          <p className="text-5xl">🎉</p>
          <p className="mt-3 text-xl font-bold">{t("complete")}</p>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={finish}
          disabled={finishing}
        >
          <Check className="h-5 w-5" />
          {t("saved")}
        </Button>
      </div>
    );
  }

  const totalExercises = entries.length;
  const progress =
    ((exIdx * totalSets + setIdx) / (totalExercises * totalSets)) * 100;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-card p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {exIdx + 1} / {totalExercises}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("set")} {setIdx + 1} / {totalSets}
          </p>
        </div>
        <h2 className="mt-1 text-2xl font-bold leading-tight">
          {ex?.exerciseName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ex?.reps ? `${ex.reps} ${t("reps").toLowerCase()}` : ""}
        </p>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full bg-foreground transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {phase === "rest" ? (
        <div className="rounded-2xl bg-sky-500/10 p-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-500">
            {t("rest")}
          </p>
          <p className="mt-2 text-7xl font-bold tabular-nums">{remaining}</p>
          <p className="mt-1 text-sm text-muted-foreground">sn</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setRunning((r) => !r)}
              size="lg"
            >
              {running ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button variant="outline" onClick={skipRest} size="lg">
              <SkipForward className="h-5 w-5" />
              {t("skip")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("work")}
          </p>
          <p className="mt-3 text-5xl font-bold">{ex?.reps ?? "—"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("reps").toLowerCase()}
          </p>
          <Button size="lg" className="mt-6 w-full" onClick={completeSet}>
            <Check className="h-5 w-5" />
            {t("next")}
          </Button>
        </div>
      )}

      <Button
        variant="ghost"
        size="lg"
        onClick={finish}
        disabled={finishing}
        className="w-full text-muted-foreground"
      >
        <Square className="h-4 w-4" />
        {t("finish")}
      </Button>
    </div>
  );
}
