"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Home, Dumbbell, Apple, Activity, User } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconComp = ComponentType<{ className?: string } & SVGProps<SVGSVGElement>>;

const items: Array<{
  href: string;
  key: "dashboard" | "workouts" | "nutrition" | "activity" | "profile";
  icon: IconComp;
}> = [
  { href: "/", key: "dashboard", icon: Home },
  { href: "/workouts", key: "workouts", icon: Dumbbell },
  { href: "/history", key: "nutrition", icon: Apple },
  { href: "/activity", key: "activity", icon: Activity },
  { href: "/profile", key: "profile", icon: User },
];

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl md:inset-x-auto md:left-1/2 md:w-[min(calc(100%-2rem),36rem)] md:-translate-x-1/2 md:rounded-t-2xl md:border-x"
    >
      <div className="mx-auto grid w-full grid-cols-5 px-1">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground/70",
              )}
            >
              <Icon
                className="h-[22px] w-[22px]"
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
