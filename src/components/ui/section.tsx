import * as React from "react";
import { cn } from "@/lib/utils";

export function SectionGroup({
  title,
  footer,
  children,
  className,
}: {
  title?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-1.5", className)}>
      {title && (
        <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      )}
      <div className="overflow-hidden rounded-2xl bg-card">{children}</div>
      {footer && (
        <p className="px-4 text-[11px] leading-snug text-muted-foreground">
          {footer}
        </p>
      )}
    </section>
  );
}

export function Row({
  leading,
  label,
  sublabel,
  value,
  trailing,
  onClick,
  className,
  hideSeparator,
}: {
  leading?: React.ReactNode;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  value?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hideSeparator?: boolean;
}) {
  const interactive = !!onClick;
  const Tag: React.ElementType = interactive ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 px-4 py-3.5 text-left",
        interactive && "transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.06]",
        !hideSeparator &&
          "before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border last:before:hidden",
        className,
      )}
    >
      {leading && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground">
          {leading}
        </span>
      )}
      <span className="min-w-0 flex-1">
        {label && <span className="block truncate text-[15px] font-normal">{label}</span>}
        {sublabel && (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {sublabel}
          </span>
        )}
      </span>
      {value && (
        <span className="shrink-0 text-[15px] text-muted-foreground">
          {value}
        </span>
      )}
      {trailing && <span className="shrink-0">{trailing}</span>}
    </Tag>
  );
}

export function RowField({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative px-4 py-3 before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border last:before:hidden">
      <label className="block">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="mt-1">{children}</div>
      </label>
      {hint && (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
