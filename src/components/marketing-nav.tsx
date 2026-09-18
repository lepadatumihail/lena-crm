import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { asLocale } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { LocaleToggle } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavFrame } from "@/components/marketing/nav-frame";

/**
 * The public header, in three shapes:
 *   landing — in-page anchors, for the home page only.
 *   page    — real links back to the home page and pricing, for every other
 *             marketing page. Its call to action follows the visitor: an
 *             agent who is already signed in wants the app, not a sign-up.
 *   minimal — controls and a way home, for the legal pages.
 * Every link follows the page's own language, so a Spanish page never sends
 * a visitor to an English URL. The strip it sits in condenses into a floating
 * pill once the page scrolls (see NavFrame).
 */
export function MarketingNav({
  variant = "landing",
  signedIn = false,
}: {
  variant?: "landing" | "page" | "minimal";
  signedIn?: boolean;
}) {
  const t = useTranslations("nav.marketing");
  const locale = asLocale(useLocale());
  const home = marketingPath("home", locale);
  // "Empieza gratis" runs wider than "Start for free": on a 375px phone the
  // Spanish row only fits beside the wordmark with the controls and the call
  // to action set a little closer. English keeps its spacing.
  const snug = locale === "es";
  const ctaClassName = snug ? "max-sm:px-3" : undefined;

  return (
    <NavFrame>
      <Link href={home} className="flex shrink-0 items-center gap-2">
        {/* Below 375px the Spanish "Empieza gratis" plus the theme and
            language controls leave no room for the wordmark; keep it for
            screen readers so the link still has a name. */}
        <Logo
          className="max-sm:text-sm"
          markClassName="max-sm:size-6"
          wordmarkClassName="max-[374px]:sr-only"
        />
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        {variant === "landing" ? (
          <>
            {/* Section links only scroll the page; on phones the sections
                are one swipe away and the row would overflow the viewport. */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden rounded-full sm:inline-flex"
            >
              <Link href="#how-it-works">{t("howItWorks")}</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden rounded-full sm:inline-flex"
            >
              <Link href="#pricing">{t("pricing")}</Link>
            </Button>
            <Controls snug={snug} />
            <Button asChild size="pill-sm" className={ctaClassName}>
              <Link href="/login">{t("startFree")}</Link>
            </Button>
          </>
        ) : variant === "page" ? (
          <>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden rounded-full sm:inline-flex"
            >
              <Link href={`${home}#how-it-works`}>{t("howItWorks")}</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden rounded-full sm:inline-flex"
            >
              <Link href={marketingPath("pricing", locale)}>{t("pricing")}</Link>
            </Button>
            <Controls snug={snug} />
            <Button asChild size="pill-sm" className={ctaClassName}>
              <Link href={signedIn ? "/home" : "/login"}>
                {signedIn ? t("backToApp") : t("startFree")}
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Controls snug={snug} />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full max-sm:size-9 max-sm:p-0"
            >
              <Link href={home}>
                <ArrowLeft />
                <span className="max-sm:sr-only">{t("backHome")}</span>
              </Link>
            </Button>
          </>
        )}
      </div>
    </NavFrame>
  );
}

/** Theme and language, kept together and ahead of the page's main action. */
function Controls({ snug }: { snug: boolean }) {
  return (
    <div
      className={cn("flex items-center gap-1 sm:mr-1", snug && "max-sm:gap-0")}
    >
      <ThemeToggle />
      <LocaleToggle className={cn(snug && "max-sm:[&>button]:px-1.5")} />
    </div>
  );
}
