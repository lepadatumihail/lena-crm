"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { History } from "lucide-react";

import { Panel } from "@/components/shell/panel";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import type { ImportActions, RecentImport } from "@/lib/actions/import";
import { SIDE_TONES } from "@/lib/crm";

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
  const format = useFormatter();
  const [undoing, setUndoing] = useState<RecentImport | null>(null);

  return (
    <Panel title={t("title")} icon={<History className="size-3.5" />}>
      <ul className="divide-y">
        {imports.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground w-24 shrink-0 tabular-nums">
              {format.dateTime(new Date(item.createdAt), { day: "numeric", month: "short" })}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium" title={item.fileName}>
              {item.fileName}
            </span>
            <Tag tone={SIDE_TONES[item.side]}>{t("side", { side: item.side })}</Tag>
            <span className="text-muted-foreground tabular-nums">
              {item.finishedAt ? t("row", { count: item.importedCount, skipped: item.skippedCount }) : t("unfinished")}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => setUndoing(item)}>
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
