import { useTranslations } from "next-intl";

import { Eyebrow } from "@/components/marketing/eyebrow";
import { Sentences } from "@/components/marketing/sentences";
import { TONE_BG, TONE_INK } from "@/lib/tones";
import { cn } from "@/lib/utils";

// These are summaries of supplied feedback, not verbatim quotations.
const AGENTS = [
  { key: "elena", name: "Elena Pantazi", initials: "EP" },
  { key: "adam", name: "Adam Crowley", initials: "AC" },
] as const;

export function Testimonials() {
  const t = useTranslations("landing.testimonials");

  return (
    <section aria-labelledby="agent-feedback" className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
      <div className="mb-8 text-center">
        <Eyebrow className="mb-3">{t("badge")}</Eyebrow>
        <h2 id="agent-feedback" className="display-3 text-balance">
          <Sentences>{t("heading")}</Sentences>
        </h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {AGENTS.map(({ key, name, initials }) => (
          <article key={key} className="bg-card/60 flex flex-col rounded-2xl border p-6 sm:p-8">
            <h3 className="text-lg font-medium">{t(`${key}.title`)}</h3>
            <p className="text-muted-foreground mt-3 mb-6 leading-relaxed">{t(`${key}.body`)}</p>
            <div className="mt-auto flex items-center gap-3">
              <span
                aria-hidden
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  TONE_BG.neutral,
                  TONE_INK.neutral
                )}
              >
                {initials}
              </span>
              <p className="text-sm font-medium">{name}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="text-muted-foreground mt-5 text-center text-xs">{t("note")}</p>
    </section>
  );
}
