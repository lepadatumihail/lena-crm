import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { asLocale } from "@/i18n/config";
import { faqEntries, LANDING_FAQ_KEYS } from "@/lib/faq";
import { marketingPath } from "@/lib/routes";
import { SUPPORT_EMAIL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { FAQ_CARD, FaqList } from "@/components/marketing/faq-list";

/**
 * The landing FAQ. The list markup is shared with the pricing and written
 * pages (FaqList); the same entries feed the FAQPage structured data.
 */
export function Faq() {
  const t = useTranslations("landing.faq");
  const locale = asLocale(useLocale());
  const entries = faqEntries(t, LANDING_FAQ_KEYS).map(({ key, question, answer }) => ({
    key,
    question,
    answer:
      key === "privacy" ? (
        <>
          {answer}{" "}
          <Link
            href={marketingPath("privacy", locale)}
            className="text-foreground decoration-foreground/25 hover:decoration-foreground font-medium underline underline-offset-4 transition-colors"
          >
            {t("privacyLink")}
          </Link>
        </>
      ) : (
        answer
      ),
  }));

  return (
    <section id="faq" className="section-y bg-muted/50 scroll-mt-20">
      <div className="mx-auto w-full max-w-6xl px-4">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="display-2 text-balance">{t("heading")}</h2>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            {t("body")}
          </p>
        </Reveal>

        <Reveal className={cn("mx-auto mt-12 max-w-3xl", FAQ_CARD)}>
          <FaqList entries={entries} />
        </Reveal>

        <Reveal className="text-muted-foreground mx-auto mt-6 max-w-3xl text-center text-sm">
          {t("ask")}{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-foreground decoration-foreground/25 hover:decoration-foreground font-medium underline underline-offset-4 transition-colors"
          >
            {SUPPORT_EMAIL}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
