import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { asLocale } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";
import { Logo } from "@/components/brand/logo";

const LEGAL_LINKS = ["privacy", "terms", "legalNotice"] as const;

/** Shared by the landing and legal pages; links follow the page's language. */
export function LandingFooter() {
  const tSite = useTranslations("site");
  const tLegal = useTranslations("nav.legal");
  const locale = asLocale(useLocale());

  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo markClassName="size-5" wordmarkClassName="text-foreground font-medium" />
          <span>— {tSite("tagline")}</span>
        </div>
        <nav
          aria-label={tLegal("label")}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
        >
          {LEGAL_LINKS.map((route) => (
            <Link
              key={route}
              href={marketingPath(route, locale)}
              className="hover:text-foreground transition-colors"
            >
              {tLegal(route)}
            </Link>
          ))}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="hover:text-foreground transition-colors"
          >
            {SUPPORT_EMAIL}
          </a>
        </nav>
        <span>
          © {new Date().getFullYear()} {SITE_NAME}
        </span>
      </div>
    </footer>
  );
}
