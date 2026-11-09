import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  Handshake,
  Info,
  MapPin,
  MessageCircle,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { JsonLd } from "@/components/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { agentPath, firstName, type AgentPage, type PageLang } from "@/lib/agent-pages/content";
import { PAGE_COPY, fill, languageName, type ReplyBucket } from "@/lib/agent-pages/copy";
import { agentPageJsonLd } from "@/lib/agent-pages/seo";
import { marketingPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { EnquiryForm } from "./enquiry-form";
import { StickyCta } from "./sticky-cta";
import { AgentPageBeacon, WhatsAppLink } from "./tracking";

/** Each language's name for itself, for the language switch. */
const SELF_NAME: Record<PageLang, string> = { en: "English", es: "Español", sv: "Svenska" };

/**
 * Side padding that also clears the notch in landscape: the page paints edge
 * to edge (viewport-fit=cover, for the phone's bottom bar).
 */
const GUTTER =
  "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]";

/** The hero settles in piece by piece; nothing moves for visitors who ask for less motion. */
const RISE = "motion-safe:[animation:agent-rise_640ms_var(--ease-out-quint)_both]";
const rise = (index: number): CSSProperties => ({ animationDelay: `${index * 70}ms` });

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

function initialsOf(name: string, lang: PageLang): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase(lang))
    .join("");
}

/**
 * A public agent page (/agent/<slug>). Phone first, because most visitors
 * arrive from a link in WhatsApp or an Instagram bio: a soft cover with the
 * agent's face over it, who they are and the languages they speak, then the
 * facts as tiles, their own words and how working together goes. The form
 * comes last on a phone, with a bar that keeps it one tap away; on a wide
 * screen it sits beside the profile and stays in view while you read.
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
  const initials = initialsOf(page.displayName, lang);
  const whatsappHref = page.whatsapp
    ? `https://wa.me/${page.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        fill(copy.whatsappHello, name)
      )}`
    : null;
  const privacyHref = marketingPath("privacy", lang === "es" ? "es" : "en");
  const paragraphs = text?.bio?.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) ?? [];
  const languages = [...page.spokenLanguages].sort(
    (a, b) => Number(b === page.nativeLanguage) - Number(a === page.nativeLanguage)
  );
  const works =
    page.works === "agency" && page.agencyName
      ? fill(copy.agency, { agency: page.agencyName })
      : copy.independent;

  // The facts as tiles: on a phone areas / since + works / helps; from sm up
  // areas beside since, then helps beside works. Missing pieces close up.
  // One template per case, handed to CSS as variables so no two arbitrary
  // classes compete for the same property.
  const hasSince = page.sinceYear !== null;
  const hasHelps = page.helps.length > 0;
  const tiles =
    hasSince && hasHelps
      ? { base: "'areas areas' 'since works' 'helps helps'", sm: "'areas areas since' 'helps helps works'" }
      : hasHelps
        ? { base: "'areas areas' 'works works' 'helps helps'", sm: "'areas areas works' 'helps helps helps'" }
        : hasSince
          ? { base: "'areas areas' 'since works'", sm: "'areas areas since' 'areas areas works'" }
          : { base: "'areas areas' 'works works'", sm: "'areas areas works'" };
  const tilesStyle = { "--tiles": tiles.base, "--tiles-sm": tiles.sm } as CSSProperties;

  const avatar = page.photoUrl ? (
    <Image
      src={page.photoUrl}
      alt=""
      width={256}
      height={256}
      priority
      className="ring-background size-full rounded-full object-cover ring-4 outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
    />
  ) : (
    <div
      aria-hidden="true"
      className="ring-background text-tone-indigo-ink font-display flex size-full items-center justify-center rounded-full bg-[linear-gradient(140deg,var(--tone-indigo-soft),var(--tone-teal-soft))] text-[2.25rem] font-medium tracking-[-0.04em] ring-4 sm:text-[2.75rem]"
    >
      {initials}
    </div>
  );

  return (
    <div
      lang={lang}
      className="bg-background text-foreground min-h-svh [-webkit-tap-highlight-color:transparent]"
    >
      <AgentPageBeacon />
      {page.isExample ? null : <JsonLd data={agentPageJsonLd(page, lang)} />}

      {page.isExample ? (
        <div className="bg-muted/70 border-b border-dashed">
          <p className={cn("text-muted-foreground mx-auto flex max-w-6xl items-start justify-center gap-2 py-2.5 text-[13px] leading-snug", GUTTER)}>
            <Info aria-hidden="true" className="mt-px size-4 shrink-0" strokeWidth={1.75} />
            {copy.exampleBanner}
          </p>
        </div>
      ) : null}

      <div className={cn("mx-auto w-full max-w-6xl pb-32 lg:pb-20", GUTTER)}>
        {page.langs.length > 1 ? (
          <nav aria-label={copy.langLabel} className="flex h-14 items-center justify-end">
            <ul className="bg-muted flex gap-0.5 rounded-full p-1">
              {page.langs.map((l) => (
                <li key={l}>
                  <Link
                    href={agentPath(page.slug, l, page.defaultLang)}
                    hrefLang={l}
                    lang={l}
                    aria-current={l === lang ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center rounded-full px-3.5 text-[13px] outline-none transition-[color,background-color,box-shadow] duration-200 select-none",
                      "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                      l === lang
                        ? "bg-background text-foreground font-medium shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {SELF_NAME[l]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <div className="h-4" />
        )}

        {/* The cover: washes of the brand's indigo and the viewing teal over grey. */}
        <div
          aria-hidden="true"
          className="bg-muted/70 relative h-36 overflow-hidden rounded-[28px] sm:h-44 lg:h-52"
        >
          <div className="absolute inset-0 bg-[radial-gradient(85%_150%_at_8%_0%,color-mix(in_oklab,var(--primary)_30%,transparent)_0%,transparent_62%),radial-gradient(70%_130%_at_100%_100%,color-mix(in_oklab,var(--tone-teal)_34%,transparent)_0%,transparent_62%),radial-gradient(55%_90%_at_62%_35%,color-mix(in_oklab,var(--tone-indigo)_16%,transparent)_0%,transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_45%,color-mix(in_oklab,var(--background)_45%,transparent))]" />
        </div>

        <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_25.5rem]">
          <main className="min-w-0">
            {/* Who they are */}
            <header className="px-1 sm:px-2">
              <div
                className={cn("relative -mt-12 size-24 sm:-mt-16 sm:size-32", RISE)}
                style={rise(0)}
              >
                {avatar}
              </div>
              <h1
                className={cn(
                  "font-display mt-5 text-[2.625rem] leading-[1.02] font-normal tracking-[-0.045em] text-balance sm:text-[3.5rem]",
                  RISE
                )}
                style={rise(1)}
              >
                {page.displayName}
              </h1>
              {text?.headline ? (
                <p
                  className={cn(
                    "text-foreground/80 mt-4 max-w-[36rem] text-[17px] leading-relaxed text-pretty sm:text-lg",
                    RISE
                  )}
                  style={rise(2)}
                >
                  {text.headline}
                </p>
              ) : null}

              <ul
                aria-label={copy.fSpeaks}
                className={cn("mt-5 flex flex-wrap gap-2", RISE)}
                style={rise(3)}
              >
                {languages.map((code) => (
                  <li
                    key={code}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px]",
                      code === page.nativeLanguage
                        ? "bg-tone-indigo-soft text-tone-indigo-ink font-medium"
                        : "bg-muted text-foreground/80"
                    )}
                  >
                    {languageName(code, lang)}
                    {code === page.nativeLanguage ? (
                      <span className="font-normal opacity-70">{copy.native}</span>
                    ) : null}
                  </li>
                ))}
              </ul>

              {reply ? (
                <p
                  className={cn(
                    "text-muted-foreground mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]",
                    RISE
                  )}
                  style={rise(4)}
                >
                  <span className="bg-tone-green-soft text-tone-green-ink inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 font-medium">
                    <Clock aria-hidden="true" className="size-3.5" strokeWidth={2} />
                    {copy.replyBadge[reply]}
                  </span>
                  {copy.replySub}
                </p>
              ) : null}

              <div
                className={cn("mt-7 flex flex-wrap gap-2.5", !whatsappHref && "lg:hidden", RISE)}
                style={rise(5)}
              >
                <a
                  id="agent-hero-cta"
                  href="#enquiry"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 rounded-full px-6 text-[15px] lg:hidden"
                  )}
                >
                  {fill(copy.ctaPrimary, name)}
                </a>
                {whatsappHref ? (
                  <WhatsAppLink
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "h-12 rounded-full px-5 text-[15px]"
                    )}
                  >
                    <MessageCircle />
                    WhatsApp
                  </WhatsAppLink>
                ) : null}
              </div>
            </header>

            {/* The facts, as tiles */}
            <section
              aria-label={fill(copy.factsLabel, name)}
              style={tilesStyle}
              className="mt-12 grid grid-cols-2 gap-3 [grid-template-areas:var(--tiles)] sm:grid-cols-3 sm:[grid-template-areas:var(--tiles-sm)]"
            >
              <Tile area="areas" label={copy.fAreas} icon={<MapPin />}>
                <Pills items={page.areas} />
              </Tile>
              {hasSince ? (
                <Tile area="since" label={copy.fSince} icon={<CalendarDays />} tone="indigo">
                  <p className="font-display text-[2.5rem] leading-none font-normal tracking-[-0.04em] tabular-nums">
                    {page.sinceYear}
                  </p>
                </Tile>
              ) : null}
              <Tile area="works" label={copy.fWorks} icon={<BadgeCheck />}>
                <p className="font-display text-lg leading-snug font-medium tracking-[-0.02em] text-balance">
                  {works}
                </p>
              </Tile>
              {hasHelps ? (
                <Tile area="helps" label={copy.fHelps} icon={<Handshake />}>
                  <Pills items={page.helps.map((h) => copy.helps[h])} />
                </Tile>
              ) : null}
            </section>

            {paragraphs.length ? (
              <section aria-labelledby="about-title" className="mt-16 px-1 sm:px-2">
                <h2
                  id="about-title"
                  className="font-display text-2xl font-medium tracking-[-0.03em] sm:text-[1.75rem]"
                >
                  {fill(copy.aboutTitle, name)}
                </h2>
                <div className="mt-5 max-w-[38rem] space-y-4 text-pretty">
                  {paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className={cn(
                        "leading-relaxed",
                        i === 0 ? "text-foreground text-lg sm:text-[19px]" : "text-foreground/75 text-base"
                      )}
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}

            <section aria-labelledby="how-title" className="mt-16 px-1 sm:px-2">
              <h2
                id="how-title"
                className="font-display text-2xl font-medium tracking-[-0.03em] sm:text-[1.75rem]"
              >
                {copy.howTitle}
              </h2>
              <ol className="mt-7">
                {steps.map((step, i) => (
                  <li
                    key={i}
                    className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4 pb-8 last:pb-0"
                  >
                    {i < steps.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className="bg-border absolute top-11 bottom-2 left-[1.125rem] w-px -translate-x-1/2"
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className="bg-tone-indigo-soft text-tone-indigo-ink font-display flex size-9 items-center justify-center rounded-full text-sm font-medium tabular-nums"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 pt-1.5">
                      <h3 className="text-[17px] leading-snug font-medium">{fill(step.title, name)}</h3>
                      <p className="text-muted-foreground mt-1.5 max-w-[34rem] text-[15px] leading-relaxed text-pretty">
                        {fill(step.body, name)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </main>

          <aside
            id="enquiry"
            aria-labelledby="enquiry-title"
            className={cn(
              "bg-card relative min-w-0 scroll-mt-6 self-start rounded-[28px] p-5 ring-1 ring-black/[0.06] sm:p-6 dark:ring-white/10",
              "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_48px_-24px_rgba(15,23,42,0.22)] dark:shadow-none",
              // Pinned only when the window shows the whole card; a shorter
              // one lets it scroll, so Continue is never cut off.
              "lg:-mt-24 lg:[@media(min-height:47rem)]:sticky lg:[@media(min-height:47rem)]:top-6",
              RISE
            )}
            style={rise(3)}
          >
            <EnquiryForm
              slug={page.slug}
              lang={lang}
              copy={copy}
              agentName={agent}
              initials={initials}
              photoUrl={page.photoUrl}
              areas={page.areas}
              offerBuy={offerBuy}
              offerSell={offerSell}
              reply={reply}
              isExample={page.isExample}
              privacyHref={privacyHref}
            />
          </aside>
        </div>
      </div>

      <footer className="border-border/70 border-t">
        <div className={cn("text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-3 py-8 pb-28 text-sm sm:flex-row sm:items-center sm:justify-between lg:pb-8", GUTTER)}>
          <a
            href={homeLink(lang, page.slug)}
            className="inline-flex min-h-11 items-center gap-2.5"
          >
            {copy.madeWith}
            <Logo markClassName="size-5" />
          </a>
          <div className="flex flex-wrap items-center gap-x-6">
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
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
            >
              {copy.report}
            </a>
          </div>
        </div>
      </footer>

      <StickyCta label={fill(copy.ctaShort, name)} whatsappHref={whatsappHref} />
    </div>
  );
}

/** One fact. The year sits on the brand's soft indigo; the rest on quiet grey. */
function Tile({
  area,
  label,
  icon,
  tone = "grey",
  children,
}: {
  area: "areas" | "since" | "works" | "helps";
  label: string;
  icon?: ReactNode;
  tone?: "grey" | "indigo";
  children: ReactNode;
}) {
  return (
    <div
      style={{ gridArea: area }}
      className={cn(
        "flex min-w-0 flex-col justify-between gap-4 rounded-3xl p-5",
        tone === "indigo"
          ? "bg-tone-indigo-soft text-tone-indigo-ink"
          : "bg-muted/60 text-foreground"
      )}
    >
      <p
        className={cn(
          "flex items-center gap-1.5 text-[13px] [&_svg]:size-3.5 [&_svg]:shrink-0",
          tone === "indigo" ? "opacity-80" : "text-muted-foreground"
        )}
      >
        {icon}
        {label}
      </p>
      {children}
    </div>
  );
}

function Pills({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="bg-background text-foreground/85 inline-flex h-8 items-center rounded-full px-3 text-[13px] shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04] dark:bg-white/[0.07] dark:shadow-none dark:ring-0"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
