import { useLocale, useTranslations } from "next-intl";

import { intlTag } from "@/i18n/config";
import { legalEntityPending } from "@/lib/legal";
import { MarketingNav } from "@/components/marketing-nav";
import { LandingFooter } from "@/components/landing/footer";

/**
 * Chrome for a legal document: nav, title, effective date, typographic
 * defaults for the plain HTML the content files emit, and the shared footer.
 * While the entity details in src/lib/legal.ts are placeholders it shows a
 * draft notice, so a half-filled page can never read as final.
 */
export function LegalArticle({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("legal");
  const locale = useLocale();
  const date = new Intl.DateTimeFormat(intlTag(locale), {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(updated));

  return (
    <div className="flex flex-1 flex-col">
      <MarketingNav variant="minimal" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
        {legalEntityPending() ? (
          <p
            role="status"
            className="bg-tone-amber-soft text-tone-amber-ink mb-8 rounded-lg px-4 py-3 text-sm"
          >
            {t("draftNotice")}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{t("updated", { date })}</p>
        <article className="mt-8 text-[15px] leading-relaxed [&_a]:decoration-foreground/25 [&_a:hover]:decoration-foreground [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_dd]:mt-0.5 sm:[&_dd]:mt-0 [&_dl]:mt-3 [&_dl]:grid [&_dl]:gap-x-6 [&_dl]:gap-y-2 [&_dl]:sm:grid-cols-[10rem_1fr] [&_dt]:font-medium [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-medium [&_h3]:mt-6 [&_h3]:font-medium [&_li]:pl-1 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6 [&_p]:mt-3 [&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_td]:border-b [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_th]:border-b [&_th]:py-2 [&_th]:pr-3 [&_th]:text-left [&_th]:font-medium [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
          {children}
        </article>
      </main>
      <LandingFooter />
    </div>
  );
}
