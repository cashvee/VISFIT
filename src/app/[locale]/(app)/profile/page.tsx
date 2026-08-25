import { auth, signOut } from "@/auth";
import { getUserById, getWeeklyWorkoutCount } from "@/db/queries";
import { fullProfileTargets } from "@/lib/calories";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/profile-form";
import { BodySilhouette } from "@/components/body-silhouette";
import { computeGoalProgress } from "@/lib/goal";
import { SectionGroup, Row } from "@/components/ui/section";
import { Link, redirect } from "@/i18n/navigation";
import {
  History as HistoryIcon,
  Activity,
  ChevronRight,
  Scale,
  Users,
} from "lucide-react";

export default async function ProfilePage({
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
  const user = await getUserById(userId);
  if (!user) {
    return <div>Not found</div>;
  }

  let targets: ReturnType<typeof fullProfileTargets> | null = null;
  if (user.sex && user.weightKg && user.heightCm && user.birthYear) {
    const weeklyWorkoutCount = await getWeeklyWorkoutCount(user.id);
    targets = fullProfileTargets({
      sex: user.sex,
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      birthYear: user.birthYear,
      weeklyWorkoutCount,
    });
  }

  const t = await getTranslations("profile");
  const tNav = await getTranslations("nav");

  const goalProgress =
    user.targetWeightKg && user.targetDate && user.weightKg
      ? computeGoalProgress({
          startWeightKg: user.goalStartWeightKg ?? user.weightKg,
          currentWeightKg: user.weightKg,
          targetWeightKg: user.targetWeightKg,
          targetDate: user.targetDate,
          goalSetAt: user.goalSetAt ?? user.createdAt,
        })
      : null;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 px-1">
        <BodySilhouette
          sex={user.sex}
          progressPct={goalProgress?.progressPct ?? 0}
          className="h-20 w-12 shrink-0 text-foreground"
        />
        <div className="min-w-0">
          {user.email && (
            <p className="truncate text-[13px] font-medium text-muted-foreground">
              {user.email}
            </p>
          )}
          <h1 className="font-display text-4xl uppercase tracking-tight leading-[0.9]">
            {t("title")}
          </h1>
        </div>
      </header>

      <ProfileForm initial={user} initialTargets={targets} />

      <SectionGroup>
        <NavRow
          href="/activity"
          icon={<Activity className="h-5 w-5" />}
          label={tNav("activity")}
        />
        <NavRow
          href="/weight"
          icon={<Scale className="h-5 w-5" />}
          label={tNav("weight")}
        />
        <NavRow
          href="/friends"
          icon={<Users className="h-5 w-5" />}
          label={tNav("friends")}
        />
        <NavRow
          href="/history"
          icon={<HistoryIcon className="h-5 w-5" />}
          label={tNav("nutrition")}
          last
        />
      </SectionGroup>

      <SectionGroup>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: `/${locale}/signin` });
          }}
        >
          <Row
            onClick={undefined}
            label={
              <button
                type="submit"
                className="block w-full text-left text-[15px] text-destructive"
              >
                {tNav("signout")}
              </button>
            }
            hideSeparator
          />
        </form>
      </SectionGroup>
    </div>
  );
}

function NavRow({
  href,
  icon,
  label,
  last,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  last?: boolean;
}) {
  return (
    <div
      className={
        "relative " +
        (!last
          ? "before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border"
          : "")
      }
    >
      <Link
        href={href}
        className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.06]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground">
          {icon}
        </span>
        <span className="flex-1 text-[15px]">{label}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </Link>
    </div>
  );
}
