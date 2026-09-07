import Link from "next/link";

import { pipelineSegments, STAGE_BAR_COLORS } from "@/lib/home";
import { clientsPath, type ClientSide, type Stage } from "@/lib/crm";
import { cn } from "@/lib/utils";

/**
 * One side of the pipeline: a stacked bar plus a chip per stage, each chip
 * linking to the client list filtered on that stage. Labels arrive already
 * translated so this stays a plain server component.
 */
export function PipelineBar({
  side,
  label,
  total,
  emptyLabel,
  stages,
}: {
  side: ClientSide;
  label: string;
  total: number;
  emptyLabel: string;
  stages: { stage: Stage; label: string; count: number; title: string }[];
}) {
  const segments = pipelineSegments(stages);
  const listHref = clientsPath(side);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Link href={listHref} className="text-sm font-medium hover:underline">
          {label}{" "}
          <span className="text-muted-foreground tabular-nums">({total})</span>
        </Link>
        {total === 0 && (
          <span className="text-muted-foreground text-xs">{emptyLabel}</span>
        )}
      </div>

      <div
        className="bg-muted flex h-2.5 w-full gap-px overflow-hidden rounded-full"
        role="img"
        aria-label={`${label}: ${stages
          .map((s) => `${s.label} ${s.count}`)
          .join(", ")}`}
      >
        {segments
          .filter((s) => s.percent > 0)
          .map((s) => (
            <span
              key={s.stage}
              className={cn("h-full transition-[width]", STAGE_BAR_COLORS[s.stage])}
              style={{ width: `${s.percent}%` }}
            />
          ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {stages.map((s) => (
          <Link
            key={s.stage}
            href={`${listHref}?stage=${s.stage}`}
            title={s.title}
            className={cn(
              "bg-muted hover:bg-accent inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs transition-colors",
              s.count === 0 && "opacity-50 hover:opacity-100"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                STAGE_BAR_COLORS[s.stage]
              )}
            />
            {s.label}{" "}
            <span className="font-semibold tabular-nums">{s.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
