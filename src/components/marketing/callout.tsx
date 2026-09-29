import { Info, Lightbulb, TriangleAlert } from "lucide-react";

import { TONE_BG, TONE_BORDER, TONE_ICON } from "@/lib/tones";
import { cn } from "@/lib/utils";

type CalloutKind = "tip" | "note" | "warning";

const STYLES: Record<
  CalloutKind,
  { icon: React.ComponentType<{ className?: string }>; box: string; mark: string }
> = {
  // A tip is the pale indigo of the app's notices, so it never reads as a note.
  tip: {
    icon: Lightbulb,
    box: cn(TONE_BORDER.indigo, TONE_BG.indigo),
    mark: TONE_ICON.indigo,
  },
  note: {
    icon: Info,
    box: "bg-muted/50",
    mark: "text-muted-foreground",
  },
  warning: {
    icon: TriangleAlert,
    box: cn(TONE_BORDER.amber, TONE_BG.amber),
    mark: TONE_ICON.amber,
  },
};

/**
 * An aside inside an article: a tip worth pulling out, a note, or something
 * to be careful with. Sits inside <Prose>, so its own paragraphs keep the
 * article's spacing but the box does not inherit a top margin from a <p>.
 */
export function Callout({
  kind = "note",
  title,
  children,
  className,
}: {
  kind?: CalloutKind;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, box, mark } = STYLES[kind];
  return (
    <aside
      className={cn(
        "mt-6 flex gap-3 rounded-xl border p-4 text-sm leading-relaxed",
        // A title leads straight into its text; the article's paragraph
        // gap would float it off as a heading of its own.
        "[&>div>:first-child]:mt-0 [&>div>[data-callout-title]+*]:mt-1",
        box,
        className
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", mark)} aria-hidden />
      <div className="min-w-0">
        {title ? (
          <p data-callout-title className="text-foreground font-medium">
            {title}
          </p>
        ) : null}
        {children}
      </div>
    </aside>
  );
}
