"use client";

interface Props {
  proteinG: number;
  carbsG: number;
  fatG: number;
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function MacroRing({
  proteinG,
  carbsG,
  fatG,
  size = 144,
  strokeWidth = 14,
  centerLabel,
  centerValue,
}: Props) {
  const proteinKcal = proteinG * 4;
  const carbsKcal = carbsG * 4;
  const fatKcal = fatG * 9;
  const total = Math.max(proteinKcal + carbsKcal + fatKcal, 1);

  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;

  const segments = [
    { kcal: proteinKcal, color: "#3b82f6", label: "P" }, // blue
    { kcal: carbsKcal, color: "#f59e0b", label: "K" }, // amber
    { kcal: fatKcal, color: "#ef4444", label: "Y" }, // red
  ];

  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        {segments.map((s, i) => {
          const frac = s.kcal / total;
          const dash = frac * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dasharray 300ms" }}
            />
          );
          offset += dash;
          return el;
        })}
        {centerValue && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-foreground)"
            fontSize={size * 0.18}
            fontWeight="700"
          >
            <tspan x="50%" dy="-0.2em">
              {centerValue}
            </tspan>
            {centerLabel && (
              <tspan
                x="50%"
                dy="1.4em"
                fill="var(--color-muted-foreground)"
                fontSize={size * 0.085}
                fontWeight="500"
              >
                {centerLabel}
              </tspan>
            )}
          </text>
        )}
      </svg>

      <ul className="flex-1 space-y-2">
        {[
          { color: "#3b82f6", label: "Protein", g: proteinG },
          { color: "#f59e0b", label: "Carbs", g: carbsG },
          { color: "#ef4444", label: "Fat", g: fatG },
        ].map((m) => (
          <li key={m.label} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: m.color }}
              />
              <span className="truncate text-[13px]">{m.label}</span>
            </div>
            <span className="shrink-0 text-[13px] font-semibold tabular-nums">
              {Math.round(m.g)}g
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
