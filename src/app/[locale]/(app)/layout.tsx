import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/signin", locale });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pt-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
