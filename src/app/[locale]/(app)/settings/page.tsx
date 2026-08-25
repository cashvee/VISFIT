import { setRequestLocale, getTranslations } from "next-intl/server";
import { SectionGroup } from "@/components/ui/section";
import { ThemeToggle } from "@/components/theme-toggle";
import { PrivacyToggles } from "@/components/privacy-toggles";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("settings");

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {t("title")}
        </h1>
      </header>

      <SectionGroup title={t("appearance")} footer={t("themeHint")}>
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <span className="text-[15px]">{t("theme")}</span>
          <ThemeToggle />
        </div>
      </SectionGroup>

      <PrivacySection />
    </div>
  );
}

async function PrivacySection() {
  const t = await getTranslations("privacy");
  return (
    <section className="space-y-1.5">
      <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("title")}
      </h2>
      <PrivacyToggles />
      <p className="px-4 text-[11px] leading-snug text-muted-foreground">
        {t("hint")}
      </p>
    </section>
  );
}
