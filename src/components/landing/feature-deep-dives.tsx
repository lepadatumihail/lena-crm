import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Inbox,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";

import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

function VisualWhatsApp() {
  const t = useTranslations("landing.deepDives.visuals");
  return (
    <div className="bg-card mock-lift mx-auto max-w-sm rounded-2xl p-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
          <MessageCircle className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium">Sofia Müller</p>
          <p className="text-muted-foreground text-[10px]">
            {t("whatsapp.online")}
          </p>
        </div>
      </div>
      <div className="space-y-1.5 py-3">
        {/* Client-facing sample: follows the client's language, not the UI's. */}
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-[#25D366]/10 p-3 text-xs leading-relaxed">
          Hallo Sofia, zwei neue Apartments mit Meerblick sind in Ihrem Budget
          aufgetaucht — sollen wir diese Woche eine Besichtigung einplanen?
        </div>
        <p className="text-primary flex items-center justify-end gap-1 text-[10px] font-medium">
          <Sparkles className="size-3" /> {t("whatsapp.draftedBy")}
        </p>
      </div>
    </div>
  );
}

function VisualMatch() {
  const t = useTranslations("landing.deepDives.visuals");
  return (
    <div className="bg-card mock-lift mx-auto max-w-sm space-y-2 rounded-2xl p-4">
      <div className="bg-muted/50 rounded-lg border p-2.5 text-xs">
        {t.rich("match.query", {
          name: "James Carter",
          b: (chunks) => <span className="font-medium">{chunks}</span>,
        })}
      </div>
      <p className="text-muted-foreground text-center text-[10px]">
        {t("match.count")}
      </p>
      {[
        { t: "Villa, Nueva Andalucía", m: t("match.meta1") },
        { t: "Villa, El Paraíso", m: t("match.meta2") },
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
  const t = useTranslations("landing.deepDives.visuals");
  return (
    <div className="bg-card mock-lift mx-auto max-w-sm rounded-2xl p-4">
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
          <p className="text-sm font-medium">
            {t("newLead", { name: "Anya Petrova" })}
          </p>
          <span className="bg-success/15 text-success rounded-full px-1.5 py-0.5 text-[9px] font-semibold">
            {t("portal.aiFilled")}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {t("portal.enquiry")}
        </p>
      </div>
    </div>
  );
}

function VisualSpeed() {
  const t = useTranslations("landing.deepDives.visuals");
  return (
    <div className="bg-card mock-lift mx-auto max-w-sm rounded-2xl p-4">
      <div className="flex items-center justify-between border-b pb-2 text-xs">
        <span className="font-medium">
          {t("newLead", { name: "Lars Nielsen" })}
        </span>
        <span className="text-success inline-flex items-center gap-1 font-medium">
          <Zap className="size-3" /> {t("speed.firstReply")}
        </span>
      </div>
      {/* Client-facing sample: follows the client's language, not the UI's. */}
      <div className="bg-primary/5 mt-3 rounded-2xl rounded-tl-sm p-3 text-xs leading-relaxed">
        Hej Lars! Tak for din henvendelse — jeg har et par lejligheder i
        Estepona, der passer perfekt. Hvornår passer det at ringe?
        <span className="text-primary mt-1.5 flex items-center gap-1 text-[10px] font-medium">
          <Sparkles className="size-3" /> {t("speed.aiDraft")}
        </span>
      </div>
    </div>
  );
}

function VisualScheduler() {
  const t = useTranslations("landing.deepDives.visuals");
  return (
    <div className="bg-card mock-lift mx-auto max-w-sm space-y-3 rounded-2xl p-4">
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <div className="bg-primary/10 text-primary flex size-10 flex-col items-center justify-center rounded-lg">
          <span className="text-[9px] font-semibold uppercase">
            {t("scheduler.month")}
          </span>
          <span className="text-sm leading-none font-bold">14</span>
        </div>
        <div className="text-xs">
          <p className="font-medium">{t("scheduler.event")}</p>
          <p className="text-muted-foreground">
            {t("scheduler.when", { name: "Olivia Brown" })}
          </p>
        </div>
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-[#25D366]/10 p-3 text-xs leading-relaxed">
        {t("scheduler.reminder")}
        <span className="text-muted-foreground mt-1 flex items-center gap-1 text-[10px]">
          <MessageCircle className="size-3 text-[#25D366]" />{" "}
          {t("scheduler.whatsapp")}
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

/** Copy lives in `landing.deepDives.items.<key>`; only the shell stays here. */
const FEATURES = [
  {
    key: "whatsapp",
    accent: "success",
    icon: MessageCircle,
    visual: <VisualWhatsApp />,
  },
  {
    key: "match",
    accent: "primary",
    icon: BadgeCheck,
    visual: <VisualMatch />,
  },
  {
    key: "portal",
    accent: "warning",
    icon: Inbox,
    visual: <VisualPortal />,
  },
  {
    key: "speed",
    accent: "destructive",
    icon: Zap,
    visual: <VisualSpeed />,
  },
  {
    key: "scheduler",
    accent: "primary",
    icon: CalendarClock,
    visual: <VisualScheduler />,
  },
] as const satisfies readonly {
  key: string;
  accent: keyof typeof ACCENTS;
  icon: React.ComponentType<{ className?: string }>;
  visual: React.ReactNode;
}[];

const POINTS = ["point1", "point2", "point3"] as const;

export function FeatureDeepDives() {
  const t = useTranslations("landing");

  return (
    <section className="section-y mx-auto w-full max-w-6xl px-4">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="display-2 text-balance">
          {t.rich("deepDives.heading", {
            nowrap: (chunks) => (
              <span className="whitespace-nowrap">{chunks}</span>
            ),
          })}
        </h2>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">
          {t("deepDives.body")}
        </p>
      </Reveal>

      <div className="mt-12 space-y-6 sm:space-y-8">
        {FEATURES.map((f, i) => {
          const accent = ACCENTS[f.accent];
          const reverse = i % 2 === 1;
          return (
            <Reveal key={f.key}>
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
                          "font-display text-5xl tabular-nums",
                          accent.num
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="text-2xl font-semibold tracking-tight">
                      {t(`deepDives.items.${f.key}.title`)}
                    </h3>
                    <p className="text-muted-foreground">
                      {t(`deepDives.items.${f.key}.body`)}
                    </p>
                    <ul className="space-y-2">
                      {POINTS.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2 text-sm"
                        >
                          <BadgeCheck
                            className={cn("mt-0.5 size-4 shrink-0", accent.check)}
                          />
                          {t(`deepDives.items.${f.key}.${point}`)}
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
