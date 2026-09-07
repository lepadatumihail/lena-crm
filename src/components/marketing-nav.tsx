import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { LocaleToggle } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function MarketingNav({
  variant = "landing",
}: {
  variant?: "landing" | "minimal";
}) {
  const t = useTranslations("nav.marketing");
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* Below 375px the Spanish "Empieza gratis" plus the theme and
              language controls leave no room for the wordmark; keep it for
              screen readers so the link still has a name. */}
          <Logo wordmarkClassName="max-[374px]:sr-only" />
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
                className="hidden sm:inline-flex"
              >
                <Link href="#how-it-works">{t("howItWorks")}</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href="#pricing">{t("pricing")}</Link>
              </Button>
              <Controls />
              <Button asChild size="sm">
                <Link href="/login">{t("startFree")}</Link>
              </Button>
            </>
          ) : (
            <>
              <Controls />
              <Button asChild variant="ghost" size="sm">
                <Link href="/">
                  <ArrowLeft /> {t("backHome")}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Theme and language, kept together and ahead of the page's main action. */
function Controls() {
  return (
    <div className="flex items-center gap-1 sm:mr-1">
      <ThemeToggle />
      <LocaleToggle />
    </div>
  );
}
