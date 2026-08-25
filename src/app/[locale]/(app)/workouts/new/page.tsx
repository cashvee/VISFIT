import { setRequestLocale, getTranslations } from "next-intl/server";
import { ExercisePicker } from "@/components/workout/exercise-picker";

export default async function NewWorkoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("workouts");

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="font-display text-4xl uppercase tracking-tight leading-[0.9]">
          {t("new")}
        </h1>
      </header>

      <ExercisePicker />
    </div>
  );
}
