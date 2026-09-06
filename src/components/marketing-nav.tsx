import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { LocaleToggle } from "@/components/locale-switcher";

export function MarketingNav({
  variant = "landing",
}: {
  variant?: "landing" | "minimal";
}) {
  const t = useTranslations("nav.marketing");
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          {variant === "landing" ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="#how-it-works">{t("howItWorks")}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="#pricing">{t("pricing")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/login">{t("signIn")}</Link>
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft /> {t("backHome")}
              </Link>
            </Button>
          )}
          <LocaleToggle className="ml-1" />
        </div>
      </div>
    </header>
  );
}
