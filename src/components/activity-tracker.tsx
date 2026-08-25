"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SectionGroup } from "@/components/ui/section";
import { Loader2, MapPin, Plus, Square, Trash2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import type { Activity } from "@/db/schema";

interface Props {
  initial: Activity[];
}

function nowDateTimeLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function ActivityTracker({ initial }: Props) {
  const t = useTranslations("activityLog");
  const tCommon = useTranslations("common");

  const [rows, setRows] = useState<Activity[]>(initial);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"running" | "cycling" | "walking" | "other">(
    "running",
  );
  const [distanceKm, setDistanceKm] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [trackingStartedAt, setTrackingStartedAt] = useState<number | null>(
    null,
  );
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchId.current !== null)
        navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  function toggleTracking() {
    if (tracking) {
      if (watchId.current !== null)
        navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setTracking(false);
      if (trackingStartedAt) {
        setDurationMin(
          String(
            Math.max(1, Math.round((Date.now() - trackingStartedAt) / 60000)),
          ),
        );
      }
      setTrackingStartedAt(null);
      return;
    }
    if (!navigator.geolocation) {
      setError("Location tracking is not available on this device.");
      return;
    }
    setError(null);
    setRoute([]);
    setTrackingStartedAt(Date.now());
    setTracking(true);
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setRoute((current) => {
          const next = [
            ...current,
            [coords.latitude, coords.longitude] as [number, number],
          ];
          const distance = next
            .slice(1)
            .reduce(
              (total, point, index) =>
                total + distanceBetween(next[index], point),
              0,
            );
          setDistanceKm(distance.toFixed(2));
          return next;
        });
      },
      () => {
        setError("Location permission is needed to track this activity.");
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          distanceKm: Number(distanceKm) || 0,
          durationSec: Math.round((Number(durationMin) || 0) * 60),
          startedAt: new Date(nowDateTimeLocal()).toISOString(),
          routeData: route.length > 1 ? JSON.stringify(route) : null,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Failed");
      }
      const data = (await res.json()) as { row: Activity };
      setRows((r) => [data.row, ...r]);
      setDistanceKm("");
      setDurationMin("");
      setOpen(false);
      setRoute([]);
      setTrackingStartedAt(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
    if (res.ok) setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-3">
      <Button onClick={() => setOpen((v) => !v)} size="lg" className="w-full">
        <Plus className="h-5 w-5" />
        {t("logActivity")}
      </Button>

      {open && (
        <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-card p-4">
          <button
            type="button"
            onClick={toggleTracking}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
          >
            {tracking ? (
              <Square className="h-4 w-4" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {tracking ? "Stop GPS tracking" : "Start GPS tracking"}
          </button>
          {route.length > 1 && <RoutePreview points={route} />}
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("type")}
            </span>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="mt-1"
            >
              <option value="running">{t("running")}</option>
              <option value="cycling">{t("cycling")}</option>
              <option value="walking">{t("walking")}</option>
              <option value="other">{t("other")}</option>
            </Select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("distanceKm")}
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                required
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("durationMin")}
              </span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                required
                className="mt-1"
              />
            </label>
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-xl bg-destructive/15 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {tCommon("save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </form>
      )}

      {rows.length > 0 && (
        <SectionGroup>
          {rows.map((r) => {
            const started =
              r.startedAt instanceof Date
                ? r.startedAt
                : new Date(r.startedAt as unknown as number);
            const durMin = Math.round(r.durationSec / 60);
            return (
              <div
                key={r.id}
                className="relative flex items-center gap-3 px-4 py-3.5 before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border last:before:hidden"
              >
                <div className="flex-1">
                  <div className="text-[15px] font-semibold">
                    {t(r.type)} · {r.distanceKm.toFixed(1)} km
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(started)} · {formatTime(started)} · {durMin}m
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(r.id)}
                  aria-label={tCommon("delete")}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </SectionGroup>
      )}
    </div>
  );
}

function distanceBetween(first: [number, number], second: [number, number]) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(second[0] - first[0]);
  const lonDelta = toRadians(second[1] - first[1]);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(first[0])) *
      Math.cos(toRadians(second[0])) *
      Math.sin(lonDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function RoutePreview({ points }: { points: Array<[number, number]> }) {
  const latitudes = points.map(([latitude]) => latitude);
  const longitudes = points.map(([, longitude]) => longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, 0.00001);
  const lonSpan = Math.max(maxLon - minLon, 0.00001);
  const polyline = points
    .map(
      ([latitude, longitude]) =>
        `${8 + ((longitude - minLon) / lonSpan) * 84},${92 - ((latitude - minLat) / latSpan) * 84}`,
    )
    .join(" ");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
      <svg
        viewBox="0 0 100 100"
        className="h-40 w-full"
        role="img"
        aria-label="Recorded route preview"
      >
        <path
          d="M0 25H100M0 50H100M0 75H100M25 0V100M50 0V100M75 0V100"
          stroke="currentColor"
          strokeOpacity=".08"
        />
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--color-sky-500, #0ea5e9)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="px-3 py-2 text-xs text-muted-foreground">
        {points.length} GPS points recorded
      </p>
    </div>
  );
}
