import { useTranslations } from "next-intl";

import { ClientAvatar } from "@/components/clients/client-avatar";
import { Eyebrow } from "@/components/marketing/eyebrow";
import { Sentences } from "@/components/marketing/sentences";
import { Reveal } from "@/components/reveal";

// These are summaries of supplied feedback, not verbatim quotations, so they
// carry no quote marks and the note under them says what they are.
const AGENTS = [
  { key: "elena", name: "Elena Pantazi" },
  { key: "adam", name: "Adam Crowley" },
] as const;

/**
 * What two agents said, placed after the walk-through and right before the
 * price: by then a visitor knows what the feedback is about. The avatars are
 * the app's own.
 */
export function Testimonials() {
  const t = useTranslations("landing.testimonials");

  return (
    <section aria-labelledby="agent-feedback" className="section-y mx-auto w-full max-w-6xl px-4">
      <Reveal className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
        <Eyebrow className="mb-4">{t("badge")}</Eyebrow>
        <h2 id="agent-feedback" className="display-2 text-balance">
          <Sentences>{t("heading")}</Sentences>
        </h2>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        {AGENTS.map(({ key, name }) => (
          <Reveal key={key}>
            <article className="bg-muted/50 flex h-full flex-col rounded-3xl p-6 sm:p-8">
              <h3 className="font-display text-xl leading-snug tracking-[-0.02em]">{t(`${key}.title`)}</h3>
              <p className="text-foreground/75 mt-3 mb-8 leading-relaxed">{t(`${key}.body`)}</p>
              <div className="mt-auto flex items-center gap-3">
                <ClientAvatar name={name} side="buyer" size="row" />
                <p className="text-sm font-medium">{name}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <p className="text-muted-foreground mt-5 text-center text-xs">{t("note")}</p>
    </section>
  );
}
