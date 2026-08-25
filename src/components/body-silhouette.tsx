"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function BodySilhouette({
  sex = "male",
  progressPct = 0,
  className,
}: {
  sex?: "male" | "female" | null;
  progressPct?: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, progressPct));
  const uid = useId().replace(/:/g, "");
  const fillY = 500 - pct * 5;
  const body = sex === "female" ? <FemaleBody /> : <MaleBody />;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 240 500"
        className="h-full w-full overflow-visible"
        role="img"
        aria-label="Body progress visual"
      >
        <defs>
          <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-signal)" />
            <stop offset="55%" stopColor="#8bdc64" />
            <stop offset="100%" stopColor="#38a887" />
          </linearGradient>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-signal)"
              stopOpacity="0.98"
            />
            <stop offset="100%" stopColor="#38a887" stopOpacity="0.7" />
          </linearGradient>
          <filter
            id={`${uid}-glow`}
            x="-50%"
            y="-20%"
            width="200%"
            height="150%"
          >
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`${uid}-clip`}>{body}</clipPath>
        </defs>

        <ellipse
          cx="120"
          cy="478"
          rx="75"
          ry="10"
          fill="currentColor"
          opacity="0.12"
        />
        <g opacity="0.12" fill={`url(#${uid}-body)`}>
          {body}
        </g>
        <g clipPath={`url(#${uid}-clip)`}>
          <rect
            x="0"
            y={fillY}
            width="240"
            height="500"
            fill={`url(#${uid}-fill)`}
          />
          <path
            d="M35 190h170M45 260h150M62 330h116M75 405h90"
            stroke="white"
            strokeOpacity="0.22"
            strokeWidth="2"
          />
        </g>
        <g
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.58"
          strokeWidth="2"
        >
          {body}
        </g>
        <g
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1.5"
        >
          <path d="M120 116v118M82 178c24 15 52 15 76 0M89 241c20 12 42 12 62 0M96 302c16 9 32 9 48 0M92 376c18 9 38 9 56 0" />
        </g>
        <circle
          cx="120"
          cy="44"
          r="28"
          fill="none"
          stroke="var(--color-signal)"
          strokeOpacity="0.35"
          strokeWidth="3"
          filter={`url(#${uid}-glow)`}
        />
      </svg>
    </div>
  );
}

function MaleBody() {
  return (
    <g>
      <circle cx="120" cy="44" r="27" />
      <path d="M103 72h34l6 28-23 13-23-13 6-28Z" />
      <path d="M97 94c-20 8-31 20-36 47l-10 73 25 4 14-65 8 78h44l8-78 14 65 25-4-10-73c-5-27-16-39-36-47l-17 11-17-11Z" />
      <path d="M98 108 80 116 59 215l25 5 30-92 30 92 25-5-21-99-18-8-10 15-10-15Z" />
      <path d="M98 226 91 333l-11 137h32l8-123 8 123h32l-11-137-7-107Z" />
    </g>
  );
}

function FemaleBody() {
  return (
    <g>
      <circle cx="120" cy="44" r="26" />
      <path d="M105 70h30l5 29-20 13-20-13 5-29Z" />
      <path d="M99 94c-17 8-27 21-31 45l-9 73 24 4 14-62 7 70h32l7-70 14 62 24-4-9-73c-4-24-14-37-31-45l-16 11-16-11Z" />
      <path d="M101 108 84 116 61 215l24 5 35-91 35 91 24-5-23-99-17-8-19 15-19-15Z" />
      <path d="M104 224 96 333l-13 137h31l6-123 6 123h31l-13-137-8-109Z" />
    </g>
  );
}
