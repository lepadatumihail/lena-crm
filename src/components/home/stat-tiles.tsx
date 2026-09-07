import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatTile = {
  label: string;
  value: string;
  /** Small line under the value: a secondary figure or a nudge when empty. */
  hint?: string | null;
  href: string;
  icon: LucideIcon;
};

export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((tile) => (
        <Link
          key={tile.label}
          href={tile.href}
          className={cn(
            "bg-card text-card-foreground hover:bg-accent/60 flex flex-col gap-1 rounded-xl border p-4 shadow-sm transition-colors"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              {tile.label}
            </span>
            <tile.icon className="text-primary size-4 shrink-0" />
          </div>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {tile.value}
          </span>
          {tile.hint && (
            <span className="text-muted-foreground truncate text-xs">
              {tile.hint}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
