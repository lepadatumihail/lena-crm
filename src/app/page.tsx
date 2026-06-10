import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Mail,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthErrorListener } from "@/components/auth-error-listener";
import { MarketingNav } from "@/components/marketing-nav";
import { Reveal } from "@/components/reveal";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { FeatureDeepDives } from "@/components/landing/feature-deep-dives";
import { AppPreview } from "@/components/landing/app-preview";

const BUYER_STEPS = ["New", "Contacted", "Qualified", "Viewing", "Reserved"];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <AuthErrorListener />

      {/* Nav */}
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Backdrop: faint grid + slowly drifting aurora glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="hero-grid absolute inset-0 opacity-50" />
          <div className="bg-primary/10 absolute -top-32 left-1/2 size-[30rem] max-w-full -translate-x-1/2 animate-[aurora_18s_ease-in-out_infinite] rounded-full blur-[130px]" />
          <div className="bg-warning/10 absolute -top-10 left-[15%] size-56 animate-[aurora_24s_ease-in-out_infinite] rounded-full blur-[120px] [animation-delay:-8s]" />
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-16 pb-12 text-center animate-[fade-up_0.7s_ease-out_both] motion-reduce:animate-none sm:pt-24">
          <Badge variant="secondary" className="mb-5 gap-1.5 px-3 py-1">
            <Sparkles className="size-3.5" />
            Built for independent agents
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Your clients, properties, and offers.{" "}
            <span className="from-primary bg-gradient-to-r to-[oklch(0.66_0.12_46)] bg-clip-text text-transparent">
              Made simple.
            </span>
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl text-lg text-pretty">
            Lena is the CRM for independent real-estate agents on the Costa del
            Sol. Track every buyer and seller from first hello to keys in hand —
            across all the agencies you work with, in one place.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">
                Get started <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#features">See how it works</Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            No password — sign in with Google or a one-time code.
          </p>

          <AppPreview />
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Everything a deal needs, nothing it doesn&apos;t
          </h2>
          <p className="text-muted-foreground mt-3">
            Spreadsheets and scattered chats don&apos;t scale. Lena gives every
            lead a place — and a next step.
          </p>
        </div>

        <FeatureGrid />
      </section>

      {/* Feature deep-dives */}
      <FeatureDeepDives />

      {/* Pipeline strip */}
      <section className="bg-muted/40 border-y">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            From lead to reserved, at a glance
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
            Every buyer follows a simple journey. Move them forward and the
            right details unlock at each step.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {BUYER_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="bg-background flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm">
                  <span className="bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full text-xs font-semibold">
                    {i + 1}
                  </span>
                  {step}
                </div>
                {i < BUYER_STEPS.length - 1 && (
                  <ArrowRight className="text-muted-foreground/50 size-4" />
                )}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-6 text-sm">
            Sellers get their own flow too — pending to qualified, with every
            listing attached.
          </p>
        </div>
      </section>

      {/* Anti-bloat / refreshingly simple */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            Built to stay simple
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-muted-foreground mt-3">
            Most CRMs are built for big brokerages and bury solo agents in tools
            they&apos;ll never touch. Lena is the opposite — the essentials,
            done well, and we leave the rest out on purpose.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="bg-card h-full rounded-2xl border p-6">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Left out — on purpose
              </h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  "IDX website builders",
                  "Power dialers & call centres",
                  "Team leaderboards & lead-routing rules",
                  "200-app integration marketplaces",
                  "Analytics dashboards no one opens",
                  "Per-seat enterprise pricing",
                ].map((t) => (
                  <li
                    key={t}
                    className="text-muted-foreground flex items-center gap-2.5 text-sm"
                  >
                    <X className="text-muted-foreground/50 size-4 shrink-0" />
                    <span className="decoration-muted-foreground/40 line-through">
                      {t}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="bg-card border-primary/30 h-full rounded-2xl border p-6 shadow-sm">
              <h3 className="text-primary text-xs font-semibold tracking-wide uppercase">
                What you actually get
              </h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  "Every client in a clear pipeline",
                  "Follow-ups that write themselves",
                  "Properties, viewings & offers together",
                  "Documents filed against each client",
                  "Installable on your phone",
                  "One place for every agency you work with",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-2.5 text-sm font-medium"
                  >
                    <Check className="text-primary size-4 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <p className="text-muted-foreground mt-8 text-center text-sm">
            Not yet another CRM — the only simple one you&apos;ll actually keep
            using.
          </p>
        </Reveal>
      </section>

      {/* AI — built in */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <Reveal className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Sparkles className="size-3.5" /> Built in · AI
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Stop chasing. Let Lena do the{" "}
            <span className="whitespace-nowrap">follow-ups.</span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
            The part every agent dreads — remembering who to email and what to
            say — handled for you. You stay in control: Lena drafts, you
            approve. No more doing it by hand.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="bg-card flex h-full flex-col rounded-2xl border p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <Mail className="size-5" />
                </div>
                <h3 className="text-lg font-semibold">
                  AI-written, per-client emails
                </h3>
              </div>
              <p className="text-muted-foreground mt-3 text-sm">
                Lena writes a warm, personal email for each client — in their
                language, referencing their budget, the properties they&apos;ve
                seen, and where they are in the journey. No blank page, no
                copy-paste. You review and send.
              </p>

              <div
                aria-hidden
                className="bg-muted/40 mt-5 rounded-xl border p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">To: Sofia Müller</span>
                  <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
                    <Sparkles className="size-3" /> AI draft · German
                  </span>
                </div>
                <div className="bg-background text-muted-foreground mt-2 rounded-lg border p-3 text-xs leading-relaxed">
                  <p className="text-foreground">Hallo Sofia,</p>
                  <p className="mt-1">
                    zwei neue Apartments in Nueva Andalucía sind in Ihrem Budget
                    aufgetaucht — beide mit Meerblick. Sollen wir diese Woche
                    eine Besichtigung einplanen?
                  </p>
                  <p className="mt-1">Beste Grüße, María</p>
                </div>
                <div className="mt-2 flex justify-end gap-1.5">
                  <span className="rounded-md border px-2 py-1 text-[10px] font-medium">
                    Edit
                  </span>
                  <span className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium">
                    <Send className="size-3" /> Send
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="bg-card flex h-full flex-col rounded-2xl border p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <Clock className="size-5" />
                </div>
                <h3 className="text-lg font-semibold">
                  Auto-engage forgotten clients
                </h3>
              </div>
              <p className="text-muted-foreground mt-3 text-sm">
                Leads go cold when they slip your mind. Lena watches for clients
                going quiet and surfaces them before you lose them — with a
                ready-to-send nudge. No spreadsheets, no reminders, nothing
                falling through the cracks.
              </p>

              <div
                aria-hidden
                className="bg-muted/40 mt-5 rounded-xl border p-3"
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold">Needs a nudge</span>
                  <span className="bg-warning/20 text-warning rounded-full px-1.5 text-[10px] font-medium">
                    3
                  </span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { n: "James Carter", s: "Qualified", d: "21 days quiet" },
                    { n: "Lars Nielsen", s: "Viewing", d: "16 days quiet" },
                    { n: "Anya Petrova", s: "Qualified", d: "12 days quiet" },
                  ].map((r) => (
                    <div
                      key={r.n}
                      className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{r.n}</p>
                        <p className="text-muted-foreground text-[10px]">
                          {r.s} · {r.d}
                        </p>
                      </div>
                      <span className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium">
                        <Sparkles className="size-3" /> Draft
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid gap-5 sm:grid-cols-3">
          <TrustItem
            icon={Smartphone}
            title="Works everywhere"
            body="Desktop and mobile, and installable as an app on your phone's home screen."
          />
          <TrustItem
            icon={ShieldCheck}
            title="Your data, yours only"
            body="Every agent's clients are fully isolated. Nobody sees your book but you."
          />
          <TrustItem
            icon={Check}
            title="Nothing to set up"
            body="Sign in and start adding clients. No training, no clutter, no per-seat sales calls."
          />
        </div>
      </section>

      {/* Rentals coming soon */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <Reveal>
          <div className="from-primary/10 to-accent/40 relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border bg-gradient-to-br p-8 text-center sm:p-12">
            <Badge className="gap-1.5">Coming soon</Badge>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Sales today. Rentals next.
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Lena handles your sales pipeline now — long and short-term rentals
              are on the way, in the same simple flow you already know.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 text-center">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to simplify your day?
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md">
            Set up takes a minute. Bring your first client into Lena and feel
            the difference.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/login">
              Get started <ArrowRight />
            </Link>
          </Button>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded text-[10px] font-bold">
              L
            </span>
            <span className="text-foreground font-medium">Lena</span>
            <span>— real-estate CRM for the Costa del Sol</span>
          </div>
          <span>© {new Date().getFullYear()} Lena</span>
        </div>
      </footer>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-5" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{body}</p>
      </div>
    </div>
  );
}
