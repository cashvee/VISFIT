import { cn } from "@/lib/utils";

/**
 * VISFIT wordmark \u2014 scalable SVG, no external asset.
 * `VIS` uses the current text color; `FIT` uses the signal accent color.
 * Sized via `h-*` (aspect ratio ~3.6:1, width auto).
 */
export function VisfitMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 210 58"
      role="img"
      aria-label="VISFIT"
      className={cn("overflow-visible fill-current", className)}
    >
      <text
        x="0"
        y="44"
        fontFamily="var(--font-visfit-display), ui-sans-serif, sans-serif"
        fontSize="48"
        letterSpacing="0.5"
      >
        VIS
        <tspan fill="var(--color-signal)">FIT</tspan>
      </text>
    </svg>
  );
}
