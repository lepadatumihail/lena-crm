import { useTranslations } from "next-intl";
import { ArrowDown, Bell, Check, Send, Sparkles } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { TONE_BG, TONE_INK, TONE_TAG } from "@/lib/tones";
import { cn } from "@/lib/utils";

const TILE_FRAME =
  "bg-muted/30 mt-auto flex min-h-64 flex-col rounded-xl border p-4";

/** Illustrative client data stays the same through all three steps. */
function CaptureTile() {
  const t = useTranslations("landing.howItWorks.tiles.capture");

  return (
    <div className={TILE_FRAME} aria-hidden>
      <div className="flex flex-wrap gap-1.5">
        {["Idealista", "WhatsApp", "Email"].map((source) => (
          <span key={source} className="bg-background text-muted-foreground rounded-full border px-2 py-0.5 text-[10px]">
            {source}
          </span>
        ))}
      </div>
      <div className="bg-background text-muted-foreground mt-3 rounded-lg border p-3 text-xs leading-relaxed">
        {t("enquiry")}
      </div>
      <div className="text-muted-foreground my-2 flex items-center justify-center gap-1.5 text-[10px]">
        <ArrowDown className="size-3" /> {t("action")}
      </div>
      <div className="bg-card rounded-lg border p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-medium",
              TONE_BG.neutral,
              TONE_INK.neutral
            )}
          >
            SM
          </span>
          <div>
            <p className="text-xs font-medium">Sofia Müller</p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">{t("details")}</p>
          </div>
          <Check className="text-success ml-auto size-4 shrink-0" />
        </div>
      </div>
    </div>
  );
}

function AttentionTile() {
  const t = useTranslations("landing.howItWorks.tiles.attention");

  return (
    <div className={TILE_FRAME} aria-hidden>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">{t("heading")}</p>
        {/* The app's tag for work due today. */}
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", TONE_TAG.amber)}>
          {t("today")}
        </span>
      </div>
      <div className="bg-card mt-3 rounded-lg border p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="border-input size-3.5 shrink-0 rounded border shadow-xs" />
          <p className="text-xs font-medium">{t("task")}</p>
        </div>
        <p className="text-muted-foreground mt-2 text-[11px]">Sofia Müller · {t("client")}</p>
        <div className="text-muted-foreground mt-3 flex items-center gap-1.5 text-[11px]">
          <Bell className="size-3" /> {t("reminder")}
        </div>
      </div>
      <div className="mt-auto pt-4">
        <p className="text-muted-foreground text-[10px]">{t("quietHeading")}</p>
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
          <span>Lars Nielsen</span>
          <span className="text-muted-foreground">{t("quietDays", { days: 16 })}</span>
        </div>
      </div>
    </div>
  );
}

function DraftTile() {
  const t = useTranslations("landing.howItWorks.tiles.draft");

  return (
    <div className={TILE_FRAME} aria-hidden>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium">Sofia Müller</p>
        <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px]">
          <Sparkles className="size-3" /> {t("language")}
        </span>
      </div>
      <div className="bg-background mt-3 flex-1 rounded-xl rounded-tl-sm border p-3 text-xs leading-relaxed" lang="de">
        <p>Hallo Sofia,</p>
        <p className="mt-2">wie hat Ihnen die Wohnung gefallen? Wenn Sie Fragen haben oder noch einmal besichtigen möchten, melden Sie sich gerne.</p>
      </div>
      <div className="mt-3 flex justify-end">
        {/* The composer's own send button: the one ink action, a rectangle. */}
        <span className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-medium shadow-xs">
          <Send className="size-3" /> {t("openWhatsApp")}
        </span>
      </div>
    </div>
  );
}

const STEPS = [
  { key: "capture", Tile: CaptureTile },
  { key: "attention", Tile: AttentionTile },
  { key: "draft", Tile: DraftTile },
] as const;

export function Workflow() {
  const t = useTranslations("landing.howItWorks");

  return (
    <ol className="mt-10 grid gap-5 lg:grid-cols-3">
      {STEPS.map(({ key, Tile }, index) => (
        <li key={key}>
          <Reveal className="bg-card flex h-full flex-col rounded-2xl border p-5 shadow-xs sm:p-6">
            <span className="text-muted-foreground mb-5 font-display text-3xl" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-lg font-medium">{t(`steps.${key}.title`)}</h3>
            <p className="text-muted-foreground mt-2 mb-6 text-sm leading-relaxed">{t(`steps.${key}.blurb`)}</p>
            <Tile />
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
