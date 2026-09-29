import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Mail } from "lucide-react";

import { asLocale, type AppLocale } from "@/i18n/config";
import { TOOL_ROUTES, marketingPath, type LinkedRoute } from "@/lib/routes";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";
import { Logo } from "@/components/brand/logo";
import { CookieChoiceButton } from "@/components/marketing/cookie-choice-button";

const LEGAL_LINKS = ["privacy", "terms", "legalNotice"] as const;

const PRODUCT_LINKS = ["pricing", "crmSpain", "crmMarbella", "about"] as const satisfies
  readonly LinkedRoute[];
const GUIDE_LINKS = [
  "guideIdealista",
  "guideFollowUp",
  "guideAndaluciaRegister",
] as const satisfies readonly LinkedRoute[];

/**
 * Shared by the landing, pricing, legal and written pages; links follow the
 * page's language.
 *
 * Two tiers: the brand, the pages worth reading next and the way to reach a
 * human on top, the legal small print below. Contact sat in the legal row
 * once and read as more boilerplate — it earns its own line.
 */
export function LandingFooter() {
  const tSite = useTranslations("site");
  const tNav = useTranslations("nav");
  const tLegal = useTranslations("nav.legal");
  const tFooter = useTranslations("landing.footer");
  const tMarketing = useTranslations("marketing");
  const locale = asLocale(useLocale());

  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="text-muted-foreground flex flex-col items-center gap-8 py-8 text-sm sm:flex-row sm:flex-wrap sm:items-start sm:justify-between lg:flex-nowrap">
          <div className="flex items-center gap-2">
            <Logo
              markClassName="size-5"
              wordmarkClassName="text-foreground font-medium"
            />
            <span>— {tSite("tagline")}</span>
          </div>

          {/* Its own row until lg: squeezed between the brand and the contact
              line, three columns ran out of room on a tablet. */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-center sm:order-last sm:w-full sm:grid-cols-3 sm:text-left lg:order-none lg:w-auto">
            <FooterColumn
              heading={tMarketing("footer.product")}
              locale={locale}
              routes={PRODUCT_LINKS}
              lead={{ href: marketingPath("home", locale), label: tNav("home") }}
            />
            <FooterColumn
              heading={tMarketing("footer.guides")}
              locale={locale}
              routes={GUIDE_LINKS}
            />
            <FooterColumn
              heading={tMarketing("footer.tools")}
              locale={locale}
              routes={TOOL_ROUTES}
              className="col-span-2 sm:col-span-1"
            />
          </div>

          <div className="flex flex-col items-center gap-1 sm:items-end">
            <span>{tFooter("contactLead")}</span>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-foreground inline-flex items-center gap-2 font-medium underline decoration-current/30 underline-offset-4 transition-colors hover:decoration-current"
            >
              <Mail className="size-4 shrink-0" aria-hidden />
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        <div className="text-muted-foreground flex flex-col-reverse items-center justify-between gap-3 border-t py-5 text-xs sm:flex-row">
          <span>
            © {new Date().getFullYear()} {SITE_NAME}
          </span>
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
            {/* Renders only where the Meta Pixel exists (production hosts). */}
            <CookieChoiceButton
              label={tLegal("cookies")}
              className="hover:text-foreground transition-colors"
            />
          </nav>
        </div>
      </div>
    </footer>
  );
}

/**
 * One column of marketing links. `lead` is for an entry that has no label in
 * the marketing catalog, such as the home page, which nav.json already names.
 */
function FooterColumn({
  heading,
  routes,
  locale,
  lead,
  className,
}: {
  heading: string;
  routes: readonly LinkedRoute[];
  locale: AppLocale;
  lead?: { href: string; label: string };
  className?: string;
}) {
  const t = useTranslations("marketing.routes");
  return (
    <nav aria-label={heading} className={className}>
      <h2 className="text-foreground text-sm font-medium">
        {heading}
      </h2>
      <ul className="mt-3 space-y-2">
        {lead ? (
          <li>
            <Link href={lead.href} className="hover:text-foreground transition-colors">
              {lead.label}
            </Link>
          </li>
        ) : null}
        {routes.map((route) => (
          <li key={route}>
            <Link
              href={marketingPath(route, locale)}
              className="hover:text-foreground transition-colors"
            >
              {t(`${route}.label`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
