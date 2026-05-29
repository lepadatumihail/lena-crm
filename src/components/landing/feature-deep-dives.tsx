import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Inbox,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

function VisualWhatsApp() {
  return (
    <div className="bg-card mx-auto max-w-sm rounded-2xl border p-4 shadow-sm">
      <div className="flex items-center gap-2 border-b pb-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
          <MessageCircle className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium">Sofia Müller</p>
          <p className="text-muted-foreground text-[10px]">online</p>
        </div>
      </div>
      <div className="space-y-1.5 py-3">
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-[#25D366]/10 p-3 text-xs leading-relaxed">
          Hallo Sofia, zwei neue Apartments mit Meerblick sind in Ihrem Budget
          aufgetaucht — sollen wir diese Woche eine Besichtigung einplanen?
        </div>
        <p className="text-primary flex items-center justify-end gap-1 text-[10px] font-medium">
          <Sparkles className="size-3" /> Drafted by AI · German
        </p>
      </div>
    </div>
  );
}

function VisualMatch() {
  return (
    <div className="bg-card mx-auto max-w-sm space-y-2 rounded-2xl border p-4 shadow-sm">
      <div className="bg-muted/50 rounded-lg border p-2.5 text-xs">
        <span className="font-medium">James Carter</span> · wants Villa ·
        €800k–1.2M · 4 bed
      </div>
      <p className="text-muted-foreground text-center text-[10px]">
        2 of your listings match
      </p>
      {[
        { t: "Villa, Nueva Andalucía", m: "€950k · 4 bed" },
        { t: "Villa, El Paraíso", m: "€1.1M · 5 bed" },
      ].map((x) => (
        <div
          key={x.t}
          className="bg-background flex items-center justify-between rounded-lg border p-2.5 text-xs"
        >
          <div>
            <p className="font-medium">{x.t}</p>
            <p className="text-muted-foreground">{x.m}</p>
          </div>
          <BadgeCheck className="text-success size-4 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function VisualPortal() {
  return (
    <div className="bg-card mx-auto max-w-sm rounded-2xl border p-4 shadow-sm">
      <div className="flex flex-wrap justify-center gap-1.5">
        {["Idealista", "Fotocasa", "Kyero"].map((p) => (
          <span
            key={p}
            className="bg-muted rounded-full px-2.5 py-1 text-[10px] font-medium"
          >
            {p}
          </span>
        ))}
      </div>
      <div className="my-2 flex justify-center">
        <ArrowRight className="text-muted-foreground/50 size-4 rotate-90" />
      </div>
      <div className="bg-background rounded-lg border p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">New lead · Anya Petrova</p>
          <span className="bg-success/15 text-success rounded-full px-1.5 py-0.5 text-[9px] font-semibold">
            Auto-added
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Penthouse · Marbella · enquiry from Idealista
        </p>
      </div>
    </div>
  );
}

function VisualSpeed() {
  return (
    <div className="bg-card mx-auto max-w-sm rounded-2xl border p-4 shadow-sm">
      <div className="flex items-center justify-between border-b pb-2 text-xs">
        <span className="font-medium">New lead · Lars Nielsen</span>
        <span className="text-success inline-flex items-center gap-1 font-medium">
          <Zap className="size-3" /> replied in 28s
        </span>
      </div>
      <div className="bg-primary/5 mt-3 rounded-2xl rounded-tl-sm p-3 text-xs leading-relaxed">
        Hej Lars! Tak for din henvendelse — jeg har et par lejligheder i
        Estepona, der passer perfekt. Hvornår passer det at ringe?
        <span className="text-primary mt-1.5 flex items-center gap-1 text-[10px] font-medium">
          <Sparkles className="size-3" /> Auto-reply · Danish
        </span>
      </div>
    </div>
  );
}

function VisualScheduler() {
  return (
    <div className="bg-card mx-auto max-w-sm space-y-3 rounded-2xl border p-4 shadow-sm">
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <div className="bg-primary/10 text-primary flex size-10 flex-col items-center justify-center rounded-lg">
          <span className="text-[9px] font-semibold uppercase">Jun</span>
          <span className="text-sm leading-none font-bold">14</span>
        </div>
        <div className="text-xs">
          <p className="font-medium">Viewing · Villa, Nueva Andalucía</p>
          <p className="text-muted-foreground">Sat 12:00 · with Olivia Brown</p>
        </div>
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-[#25D366]/10 p-3 text-xs leading-relaxed">
        Reminder: your viewing is tomorrow at 12:00.
        <span className="text-muted-foreground mt-1 flex items-center gap-1 text-[10px]">
          <MessageCircle className="size-3 text-[#25D366]" /> Sent on WhatsApp
        </span>
      </div>
    </div>
  );
}

type Accent = {
  panel: string;
  icon: string;
  num: string;
  check: string;
};

const ACCENTS: Record<string, Accent> = {
  success: {
    panel: "from-success/10",
    icon: "bg-success/15 text-success",
    num: "text-success/30",
    check: "text-success",
  },
  primary: {
    panel: "from-primary/10",
    icon: "bg-primary/15 text-primary",
    num: "text-primary/20",
    check: "text-primary",
  },
  warning: {
    panel: "from-warning/10",
    icon: "bg-warning/15 text-warning",
    num: "text-warning/30",
    check: "text-warning",
  },
  destructive: {
    panel: "from-destructive/10",
    icon: "bg-destructive/15 text-destructive",
    num: "text-destructive/25",
    check: "text-destructive",
  },
};

type Feature = {
  tag?: string;
  accent: keyof typeof ACCENTS;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  points: string[];
  visual: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    tag: "Soon",
    accent: "success",
    icon: MessageCircle,
    title: "AI-written WhatsApp messages",
    body: "Tap a client and Lena drafts the WhatsApp message for you — warm, personal, and in their language. Read it, tweak it, send it.",
    points: [
      "Opens straight in WhatsApp",
      "Written in the client's own language",
      "You always approve before it sends",
    ],
    visual: <VisualWhatsApp />,
  },
  {
    accent: "primary",
    icon: BadgeCheck,
    title: "Buyer ↔ listing auto-match",
    body: "Because you track buyers and sellers in one place, Lena instantly shows which of your listings fit each buyer's budget, type and bedrooms.",
    points: [
      "Matches on budget, type & bedrooms",
      "One tap from buyer to the seller",
      "No double-handling between sides",
    ],
    visual: <VisualMatch />,
  },
  {
    tag: "Soon",
    accent: "warning",
    icon: Inbox,
    title: "Portal lead capture",
    body: "Enquiries from Idealista, Fotocasa and Kyero land in Lena automatically — parsed and dropped into your pipeline, no copy-paste.",
    points: [
      "Works with the portals you already use",
      "Auto-creates the lead, pre-filled",
      "Never lose an enquiry in your inbox",
    ],
    visual: <VisualPortal />,
  },
  {
    tag: "Soon",
    accent: "destructive",
    icon: Zap,
    title: "Multilingual speed-to-lead",
    body: "The moment a lead arrives, Lena drafts an instant first reply in their language — so you're first to respond, every single time.",
    points: [
      "Replies within seconds",
      "In the lead's own language",
      "First to reply wins the deal",
    ],
    visual: <VisualSpeed />,
  },
  {
    tag: "Soon",
    accent: "primary",
    icon: CalendarClock,
    title: "Viewing scheduler + WhatsApp reminders",
    body: "Book viewings, sync them to your calendar, and Lena sends the client a WhatsApp reminder in their language — so no-shows drop.",
    points: [
      "Syncs to your Google Calendar",
      "Automatic WhatsApp reminders",
      "Fewer missed viewings",
    ],
    visual: <VisualScheduler />,
  },
];

export function FeatureDeepDives() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Built for how Costa del Sol agents actually work
        </h2>
        <p className="text-muted-foreground mt-3">
          The things the big CRMs miss — WhatsApp, portals, languages — done
          simply.
        </p>
      </Reveal>

      <div className="mt-12 space-y-6 sm:space-y-8">
        {FEATURES.map((f, i) => {
          const accent = ACCENTS[f.accent];
          const reverse = i % 2 === 1;
          return (
            <Reveal key={f.title}>
              <div
                className={cn(
                  "relative overflow-hidden rounded-3xl border to-transparent p-6 sm:p-10",
                  reverse ? "bg-gradient-to-bl" : "bg-gradient-to-br",
                  accent.panel
                )}
              >
                <div className="grid items-center gap-8 md:grid-cols-2">
                  <div className={cn("space-y-4", reverse && "md:order-2")}>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-11 items-center justify-center rounded-xl",
                          accent.icon
                        )}
                      >
                        <f.icon className="size-5" />
                      </div>
                      <span
                        className={cn(
                          "text-4xl font-bold tabular-nums",
                          accent.num
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-semibold tracking-tight">
                        {f.title}
                      </h3>
                      {f.tag && <Badge variant="secondary">{f.tag}</Badge>}
                    </div>
                    <p className="text-muted-foreground">{f.body}</p>
                    <ul className="space-y-2">
                      {f.points.map((p) => (
                        <li
                          key={p}
                          className="flex items-start gap-2 text-sm"
                        >
                          <BadgeCheck
                            className={cn("mt-0.5 size-4 shrink-0", accent.check)}
                          />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div aria-hidden className={cn(reverse && "md:order-1")}>
                    {f.visual}
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
