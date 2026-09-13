import { Info, Lightbulb, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type CalloutKind = "tip" | "note" | "warning";

const STYLES: Record<
  CalloutKind,
  { icon: React.ComponentType<{ className?: string }>; box: string; mark: string }
> = {
  tip: {
    icon: Lightbulb,
    box: "border-primary/30 bg-primary/5",
    mark: "text-primary",
  },
  note: {
    icon: Info,
    box: "bg-muted/50",
    mark: "text-muted-foreground",
  },
  warning: {
    icon: TriangleAlert,
    box: "border-warning/40 bg-warning/10",
    mark: "text-warning",
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
        "[&>div>:first-child]:mt-0",
        box,
        className
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", mark)} aria-hidden />
      <div className="min-w-0">
        {title ? <p className="text-foreground font-semibold">{title}</p> : null}
        {children}
      </div>
    </aside>
  );
}
