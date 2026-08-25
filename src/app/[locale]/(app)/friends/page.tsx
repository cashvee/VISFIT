import { setRequestLocale, getTranslations } from "next-intl/server";
import { FriendsPanel } from "@/components/friends-panel";

export default async function FriendsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("friends");

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {t("title")}
        </h1>
      </header>
      <FriendsPanel />
    </div>
  );
}
