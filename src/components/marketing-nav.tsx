import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { asLocale } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { LocaleMenu } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavFrame } from "@/components/marketing/nav-frame";
import { PhoneMenu } from "@/components/marketing/phone-menu";
import { SignUpDialog } from "@/components/marketing/sign-up-dialog";
import { SiteMenu } from "@/components/marketing/site-menu";

/**
 * The public header, in three shapes:
 *   landing — for the home page: how it works and pricing are its own
 *             chapters, so those links only scroll.
 *   page    — every other marketing page; the same links lead back to the
 *             home page. Its call to action follows the visitor: an agent
 *             who is already signed in wants the app, not a sign-up.
 * Both carry the site's menus beside the logo (Product, Tools, Guides,
 * Pricing; see SiteMenu) from lg, and a menu button at the end of the bar
 * below it (PhoneMenu), which on phones also takes the theme and language
 * controls so the call to action keeps its room.
 * "Start for free" opens the sign-up dialog in place (SignUpDialog), so the
 * visitor stays on the page and an ad's utm tags reach the new profile. A
 * page can send the new agent somewhere other than Home (`signUpNext`): the
 * client tracker's page opens the import.
 *   minimal — controls and a way home, for the legal pages, sign-in and the
 *             ad landings, which keep the visitor on one task.
 * Every link follows the page's own language, so a Spanish page never sends
 * a visitor to an English URL. The strip it sits in condenses into a floating
 * pill once the page scrolls (see NavFrame). Links are regular weight; only
 * the ink call to action is medium.
 */
export function MarketingNav({
  variant = "landing",
  signedIn = false,
  signUpNext,
}: {
  variant?: "landing" | "page" | "minimal";
  signedIn?: boolean;
  /** Where "Start for free" lands a new agent on a `page` header, when not Home. */
  signUpNext?: string;
}) {
  const t = useTranslations("nav.marketing");
  const locale = asLocale(useLocale());
  const home = marketingPath("home", locale);
  // "Empieza gratis" and «Начать бесплатно» run wider than "Start for free":
  // on a 375px phone those rows only fit beside the wordmark with the controls
  // and the call to action set a little closer. English keeps its spacing.
  const snug = locale !== "en";
  const ctaClassName = snug ? "max-sm:px-3" : undefined;

  const logo = (
    <Link href={home} className="flex shrink-0 items-center gap-2">
      {/* Below 375px a longer call to action ("Empieza gratis") plus the
          controls beside it leave no room for the wordmark; keep it for
          screen readers so the link still has a name. */}
      <Logo
        className="max-sm:text-sm"
        markClassName="max-sm:size-6"
        wordmarkClassName="max-[374px]:sr-only"
      />
    </Link>
  );

  if (variant === "minimal") {
    return (
      <NavFrame>
        {logo}
        <div className="flex items-center gap-1 sm:gap-2">
          <Controls snug={snug} />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full font-normal max-sm:size-9 max-sm:p-0"
          >
            <Link href={home}>
              <ArrowLeft />
              <span className="max-sm:sr-only">{t("backHome")}</span>
            </Link>
          </Button>
        </div>
      </NavFrame>
    );
  }

  const onHome = variant === "landing";
  // The page's main action: in the bar, and again at the foot of the phone menu.
  const action = (size: "pill-sm" | "pill", className?: string) =>
    !onHome && signedIn ? (
      <Button asChild size={size} className={className}>
        <Link href="/home">{t("backToApp")}</Link>
      </Button>
    ) : (
      <SignUpDialog size={size} className={className} next={onHome ? undefined : signUpNext}>
        {t("startFree")}
      </SignUpDialog>
    );

  return (
    <NavFrame>
      <div className="flex min-w-0 items-center gap-4 xl:gap-6">
        {logo}
        <SiteMenu onHome={onHome} />
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        {/* On phones the controls move into the menu: the wordmark, the call
            to action and the menu button fill the bar. */}
        <Controls snug={snug} className="max-sm:hidden" />
        {action("pill-sm", ctaClassName)}
        <PhoneMenu onHome={onHome} action={action("pill", "w-full")} />
      </div>
    </NavFrame>
  );
}

/** Theme and language, kept together and ahead of the page's main action. */
function Controls({ snug, className }: { snug: boolean; className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-1 sm:mr-1", snug && "max-sm:gap-0", className)}
    >
      <ThemeToggle />
      {/* On a phone the longer calls to action need the globe's room too. */}
      <LocaleMenu className={cn(snug && "max-sm:px-1.5 max-sm:[&>svg:first-child]:hidden")} />
    </div>
  );
}
