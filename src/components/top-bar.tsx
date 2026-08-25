"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ArrowLeft, Settings } from "lucide-react";

export function TopBar({ showSettings = true }: { showSettings?: boolean }) {
  const tNav = useTranslations("nav");
  const tCoach = useTranslations("coach");
  const pathname = usePathname();

  // Pages that use "back" mode (full-screen experiences, no logo + gear).
  const backMode =
    pathname === "/insights" || pathname.startsWith("/insights/");

  if (backMode) {
    return (
      <header className="safe-top sticky top-0 z-20 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label={tCoach("back")}
            className="grid h-10 w-10 -ml-2 place-items-center rounded-full text-foreground transition-colors hover:bg-foreground/10"
          >
            <ArrowLeft className="h-[22px] w-[22px]" />
          </Link>
          <h1 className="text-[17px] font-semibold tracking-tight">
            {tCoach("title")}
          </h1>
          <span aria-hidden className="h-10 w-10" />
        </div>
      </header>
    );
  }

  return (
    <header className="safe-top sticky top-0 z-20 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <span className="h-10 w-10" aria-hidden />
        {showSettings ? (
          <Link
            href="/settings"
            aria-label={tNav("settings")}
            className="grid h-10 w-10 -mr-2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <Settings className="h-[22px] w-[22px]" />
          </Link>
        ) : (
          <span className="h-10 w-10" aria-hidden />
        )}
      </div>
    </header>
  );
}
