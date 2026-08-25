import { setRequestLocale, getTranslations } from "next-intl/server";
import { FriendSummary } from "@/components/friend-summary";

export default async function FriendDetailPage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("friends");

  return (
    <div className="space-y-6">
      <header className="px-1">
        <p className="text-[13px] font-medium text-muted-foreground">
          @{username}
        </p>
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {t("summary")}
        </h1>
      </header>
      <FriendSummary username={username} />
    </div>
  );
}
