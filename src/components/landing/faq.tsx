import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import { asLocale } from "@/i18n/config";
import { faqEntries } from "@/lib/faq";
import { marketingPath } from "@/lib/routes";
import { Reveal } from "@/components/reveal";

/**
 * Plain <details> so every answer is in the HTML for crawlers and works with
 * no JavaScript; the same entries feed the FAQPage structured data.
 */
export function Faq() {
  const t = useTranslations("landing.faq");
  const locale = asLocale(useLocale());
  const entries = faqEntries(t);

  return (
    <section
      id="faq"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("heading")}
        </h2>
        <p className="text-muted-foreground mt-3">{t("body")}</p>
      </Reveal>

      <Reveal className="bg-card mx-auto mt-10 max-w-3xl divide-y rounded-2xl border shadow-sm">
        {entries.map(({ key, question, answer }) => (
          <details key={key} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left [&::-webkit-details-marker]:hidden">
              <h3 className="font-medium">{question}</h3>
              <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {answer}
              {key === "privacy" ? (
                <>
                  {" "}
                  <Link
                    href={marketingPath("privacy", locale)}
                    className="text-foreground underline underline-offset-4"
                  >
                    {t("privacyLink")}
                  </Link>
                </>
              ) : null}
            </p>
          </details>
        ))}
      </Reveal>
    </section>
  );
}
