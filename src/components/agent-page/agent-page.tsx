import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, MessageCircle } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { JsonLd } from "@/components/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { agentPath, firstName, type AgentPage, type PageLang } from "@/lib/agent-pages/content";
import { PAGE_COPY, fill, languageName, type ReplyBucket } from "@/lib/agent-pages/copy";
import { agentPageJsonLd } from "@/lib/agent-pages/seo";
import { marketingPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { EnquiryForm } from "./enquiry-form";
import { AgentPageBeacon, WhatsAppLink } from "./tracking";

/** Each language's name for itself, for the language switch. */
const SELF_NAME: Record<PageLang, string> = { en: "English", es: "Español", sv: "Svenska" };

/** Where "Made with LeadWing" points, tagged so sign-ups from pages can be counted. */
function homeLink(lang: PageLang, slug: string): string {
  const home = lang === "es" ? marketingPath("home", "es") : "/";
  const utm = new URLSearchParams({
    utm_source: "agent_page",
    utm_medium: "referral",
    utm_campaign: "made_with",
    utm_content: slug,
  });
  return `${home}?${utm}`;
}

/**
 * A public agent page (/agent/<slug>): who the agent is, where they work,
 * the languages they speak, and a short form whose enquiries land in their
 * LeadWing. Phone first: most visitors arrive from a link in WhatsApp or an
 * Instagram bio. On a wide screen the form moves up beside the facts.
 */
export function AgentPageView({
  page,
  lang,
  reply,
}: {
  page: AgentPage;
  lang: PageLang;
  reply: ReplyBucket | null;
}) {
  const copy = PAGE_COPY[lang];
  const text = page.content[lang] ?? page.content[page.defaultLang];
  const agent = firstName(page.displayName);
  const name = { name: agent };
  const offerBuy = page.helps.some((h) => h !== "selling") || page.helps.length === 0;
  const offerSell = page.helps.includes("selling");
  const steps = offerBuy ? copy.buyerSteps : copy.sellerSteps;
  const initials = page.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase(lang))
    .join("");
  const whatsappHref = page.whatsapp
    ? `https://wa.me/${page.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        fill(copy.whatsappHello, name)
      )}`
    : null;
  const privacyHref = marketingPath("privacy", lang === "es" ? "es" : "en");
  const paragraphs = text?.bio?.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) ?? [];

  const facts: { label: string; value: ReactNode }[] = [
    {
      label: copy.fSpeaks,
      value: (
        <Pills
          items={page.spokenLanguages.map((code) =>
            code === page.nativeLanguage
              ? `${languageName(code, lang)} (${copy.native})`
              : languageName(code, lang)
          )}
        />
      ),
    },
    { label: copy.fAreas, value: <Pills items={page.areas} /> },
  ];
  if (page.helps.length) {
    facts.push({ label: copy.fHelps, value: <Pills items={page.helps.map((h) => copy.helps[h])} /> });
  }
  if (page.sinceYear) facts.push({ label: copy.fSince, value: String(page.sinceYear) });
  facts.push({
    label: copy.fWorks,
    value:
      page.works === "agency" && page.agencyName
        ? fill(copy.agency, { agency: page.agencyName })
        : copy.independent,
  });

  return (
    <div lang={lang} className="bg-background text-foreground">
      <AgentPageBeacon />
      {page.isExample ? null : <JsonLd data={agentPageJsonLd(page, lang)} />}

      {page.isExample ? (
        <p className="bg-muted text-muted-foreground border-b border-dashed px-4 py-2.5 text-center text-[13px] leading-snug">
          {copy.exampleBanner}
        </p>
      ) : null}

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        {page.langs.length > 1 ? (
          <nav aria-label={copy.langLabel} className="flex justify-end pt-3">
            <ul className="bg-muted inline-flex gap-0.5 rounded-full p-1">
              {page.langs.map((l) => (
                <li key={l}>
                  <Link
                    href={agentPath(page.slug, l, page.defaultLang)}
                    hrefLang={l}
                    lang={l}
                    aria-current={l === lang ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-10 items-center rounded-full px-3.5 text-sm outline-none transition-[color,background-color,box-shadow] duration-150",
                      "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                      l === lang
                        ? "bg-background text-foreground font-medium shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {SELF_NAME[l]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <header className="flex flex-wrap items-center gap-x-8 gap-y-5 pt-5 pb-2">
          {page.photoUrl ? (
            <Image
              src={page.photoUrl}
              alt=""
              width={112}
              height={112}
              priority
              className="size-24 shrink-0 rounded-full object-cover sm:size-28"
            />
          ) : (
            <div
              aria-hidden="true"
              className="bg-tone-indigo-soft text-tone-indigo-ink font-display flex size-24 shrink-0 items-center justify-center rounded-full text-[2.75rem] leading-none sm:size-28"
            >
              {initials}
            </div>
          )}
          <div className="flex min-w-[min(100%,18rem)] flex-1 flex-col gap-2.5">
            <h1 className="font-display text-[clamp(2.75rem,6vw,4rem)] leading-none tracking-tight">
              {page.displayName}
            </h1>
            {text?.headline ? (
              <p className="text-foreground/85 max-w-[34em] text-lg leading-snug">{text.headline}</p>
            ) : null}
            {reply ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Tag tone="green" className="text-sm">
                  <Clock />
                  {copy.replyBadge[reply]}
                </Tag>
                <span className="text-muted-foreground text-[13px]">{copy.replySub}</span>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2.5 pt-1.5">
              <a href="#enquiry" className={cn(buttonVariants({ size: "lg" }), "h-12 px-5 text-base")}>
                {fill(copy.ctaPrimary, name)}
              </a>
              {whatsappHref ? (
                <WhatsAppLink
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-4 text-base")}
                >
                  <MessageCircle />
                  WhatsApp
                </WhatsAppLink>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex flex-wrap items-start gap-x-8 gap-y-10 pt-8 pb-14">
          <div className="flex min-w-0 flex-[999_1_32rem] flex-col gap-10">
            <section aria-label={fill(copy.factsLabel, name)} className="rounded-2xl border px-5">
              <dl>
                {facts.map((fact, i) => (
                  <div
                    key={fact.label}
                    className={cn("flex flex-wrap gap-x-4 gap-y-1.5 py-3.5", i > 0 && "border-t")}
                  >
                    <dt className="text-muted-foreground w-36 shrink-0 text-sm leading-7">{fact.label}</dt>
                    <dd className="min-w-0 flex-[1_1_14rem] text-[15px] leading-7">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {paragraphs.length ? (
              <section aria-labelledby="about-title" className="flex flex-col gap-3">
                <h2 id="about-title" className="font-display text-[1.875rem] leading-tight">
                  {fill(copy.aboutTitle, name)}
                </h2>
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-foreground/85 text-base leading-relaxed">
                    {p}
                  </p>
                ))}
              </section>
            ) : null}

            <section aria-labelledby="how-title" className="flex flex-col gap-3">
              <h2 id="how-title" className="font-display text-[1.875rem] leading-tight">
                {copy.howTitle}
              </h2>
              <ol className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-2.5">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border p-4">
                    <span
                      aria-hidden="true"
                      className="bg-tone-indigo-soft text-tone-indigo-ink inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium"
                    >
                      {i + 1}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="text-[15px] leading-snug font-medium">{fill(step.title, name)}</span>
                      <span className="text-muted-foreground text-sm leading-relaxed">
                        {fill(step.body, name)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside
            id="enquiry"
            aria-labelledby="enquiry-title"
            className="bg-card min-w-0 flex-[1_1_21rem] scroll-mt-6 rounded-2xl border p-5 sm:p-6"
          >
            <EnquiryForm
              slug={page.slug}
              lang={lang}
              copy={copy}
              agentName={agent}
              areas={page.areas}
              offerBuy={offerBuy}
              offerSell={offerSell}
              reply={reply}
              isExample={page.isExample}
              privacyHref={privacyHref}
            />
          </aside>
        </main>
      </div>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 text-sm sm:px-6">
          <a href={homeLink(lang, page.slug)} className="inline-flex min-h-11 items-center gap-2">
            {copy.madeWith}
            <Logo markClassName="size-5" />
          </a>
          <div className="flex flex-wrap items-center gap-x-5">
            <a
              href={homeLink(lang, page.slug)}
              className="text-tone-indigo-ink inline-flex min-h-11 items-center font-medium"
            >
              {copy.ownPage}
            </a>
            <a
              href={`mailto:info@leadwing.app?subject=${encodeURIComponent(
                fill(copy.reportSubject, { slug: page.slug })
              )}`}
              className="inline-flex min-h-11 items-center underline underline-offset-4"
            >
              {copy.report}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Pills({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className="bg-muted text-foreground/85 rounded-full px-2.5 py-0.5 text-sm">
          {item}
        </li>
      ))}
    </ul>
  );
}
