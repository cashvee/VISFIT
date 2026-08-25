import { auth } from "@/auth";
import { db } from "@/db/client";
import { weightLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { WeightTracker } from "@/components/weight-tracker";
import { redirect } from "@/i18n/navigation";

export default async function WeightPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect({ href: "/signin", locale });
    return null;
  }
  const rows = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, userId))
    .orderBy(desc(weightLogs.loggedAt))
    .limit(200);

  const t = await getTranslations("weight");

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="font-display text-4xl uppercase tracking-tight leading-[0.9]">
          {t("title")}
        </h1>
      </header>
      <WeightTracker initial={rows} />
    </div>
  );
}
