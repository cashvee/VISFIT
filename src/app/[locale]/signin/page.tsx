import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { VisfitMark } from "@/components/ui/visfit-mark";
import { ArrowDown } from "lucide-react";
import { VisitorCounter } from "@/components/visitor-counter";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user) {
    redirect(`/${locale}`);
  }

  const { callbackUrl } = await searchParams;
  const t = await getTranslations("signin");
  const tLanding = await getTranslations("landing");

  const signInForm = (
    <form
      action={async (formData) => {
        "use server";
        const email = String(formData.get("email") ?? "");
        const password = String(formData.get("password") ?? "");
        await signIn("credentials", {
          email,
          password,
          redirectTo: callbackUrl ?? `/${locale}`,
        });
      }}
      className="w-full"
    >
      <div className="mb-3 space-y-2">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-lg border border-white/25 bg-black/25 px-3 py-3 text-sm text-white placeholder:text-white/55"
        />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Password (8+ characters)"
          className="w-full rounded-lg border border-white/25 bg-black/25 px-3 py-3 text-sm text-white placeholder:text-white/55"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full bg-signal text-signal-foreground hover:bg-signal/85"
      >
        {tLanding("ctaPrimary")}
      </Button>
    </form>
  );

  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      {/* HERO */}
      <section className="relative flex min-h-dvh w-full flex-col justify-end overflow-hidden">
        <SmartImage
          query="professional athlete running city night"
          orientation="landscape"
          alt="VISFIT athlete"
          className="absolute inset-0 h-full w-full"
          priority
          showAttribution
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />

        <div className="relative z-10 mx-auto w-full max-w-md space-y-6 px-6 pb-10 pt-24 text-white">
          <VisfitMark className="h-8 w-auto" />
          <h1 className="font-display text-5xl uppercase leading-[0.9] tracking-tight">
            {tLanding("headline")}
          </h1>
          <div className="space-y-3 pt-2">
            {signInForm}
            <a
              href="#flow"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/30 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
            >
              {tLanding("ctaSecondary")}
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>
          <p className="pt-1 text-center text-xs text-white/50">
            {t("privacy")}
          </p>
        </div>
      </section>

      {/* FLOW: Goal -> Train & Fuel -> Progress */}
      <section id="flow" className="mx-auto max-w-md space-y-3 px-4 py-10">
        <FlowCard
          query="athlete goal setting fitness tracker"
          orientation="square"
          title={tLanding("flowGoalTitle")}
          body={tLanding("flowGoalBody")}
        />
        <FlowCard
          query="strength training modern gym"
          orientation="square"
          title={tLanding("flowTrainTitle")}
          body={tLanding("flowTrainBody")}
        />
        <FlowCard
          query="athlete progress fitness success"
          orientation="square"
          title={tLanding("flowProgressTitle")}
          body={tLanding("flowProgressBody")}
        />

        <VisitorCounter />
      </section>
    </div>
  );
}

function FlowCard({
  query,
  orientation,
  title,
  body,
}: {
  query: string;
  orientation: "square" | "landscape" | "portrait";
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-3">
      <SmartImage
        query={query}
        orientation={orientation}
        alt={title}
        className="h-16 w-16 shrink-0 rounded-xl"
      />
      <div className="min-w-0">
        <p className="font-display text-lg uppercase leading-tight tracking-tight">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
