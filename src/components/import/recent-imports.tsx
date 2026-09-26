"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { History } from "lucide-react";

import { Panel } from "@/components/shell/panel";
import { useAgentTimeZone } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { dateFnsLocale } from "@/i18n/dates";
import type { ImportActions, RecentImport } from "@/lib/actions/import";
import { SIDE_TONES } from "@/lib/crm";
import { dateKeyInTimeZone } from "@/lib/home";

import { UndoDialog } from "./undo-dialog";

export function RecentImports({
  imports,
  actions,
  onUndone,
}: {
  imports: RecentImport[];
  actions: Pick<ImportActions, "previewUndo" | "undoClientImport">;
  onUndone: (id: string) => void;
}) {
  const t = useTranslations("imports.recent");
  // "24 Sep", as dates read on the client page (the bare "en" formatter says
  // "Sep 24"), on the agent's calendar day: the same on the server and in
  // the browser, whatever zone either runs in.
  const dfl = dateFnsLocale(useLocale());
  const timeZone = useAgentTimeZone();
  const day = (iso: string) =>
    format(parseISO(dateKeyInTimeZone(iso, timeZone)), "d MMM", { locale: dfl });
  const [undoing, setUndoing] = useState<RecentImport | null>(null);

  return (
    <Panel title={t("title")} icon={<History className="size-3.5" />}>
      <ul className="divide-y">
        {imports.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground w-24 shrink-0 tabular-nums max-sm:hidden">
              {day(item.createdAt)}
            </span>
            {/* One line on a wide screen; on a phone the file name, then the facts under it. */}
            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
              <p className="min-w-0 truncate font-medium sm:flex-1" title={item.fileName}>
                {item.fileName}
              </p>
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums max-sm:mt-1 max-sm:text-xs sm:gap-x-3">
                <span className="sm:hidden">{day(item.createdAt)}</span>
                <Tag tone={SIDE_TONES[item.side]}>{t("side", { side: item.side })}</Tag>
                <span>
                  {item.finishedAt ? t("row", { count: item.importedCount, skipped: item.skippedCount }) : t("unfinished")}
                </span>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setUndoing(item)}>
              {t("undo")}
            </Button>
          </li>
        ))}
      </ul>
      {undoing ? (
        <UndoDialog
          importId={undoing.id}
          fileName={undoing.fileName}
          actions={actions}
          open
          onOpenChange={(open) => {
            if (!open) setUndoing(null);
          }}
          onUndone={() => onUndone(undoing.id)}
        />
      ) : null}
    </Panel>
  );
}
