"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ImportActions, UndoPreview } from "@/lib/actions/import";

/**
 * "Undo this import?": how many clients go, how many have been worked on
 * since, and the choice to keep those.
 */
export function UndoDialog({
  importId,
  fileName,
  actions,
  open,
  onOpenChange,
  onUndone,
}: {
  importId: string;
  fileName: string;
  actions: Pick<ImportActions, "previewUndo" | "undoClientImport">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUndone: () => void;
}) {
  const t = useTranslations("imports.undo");
  const tCommon = useTranslations("common");
  const id = useId();
  const [preview, setPreview] = useState<UndoPreview | null>(null);
  const [keepWorked, setKeepWorked] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let live = true;
    void actions.previewUndo(importId).then((result) => {
      if (live) setPreview(result);
    });
    return () => {
      live = false;
    };
  }, [open, importId, actions]);

  function handleOpenChange(next: boolean) {
    // The counts are fetched again on the next open.
    if (!next) setPreview(null);
    onOpenChange(next);
  }

  async function undo() {
    setBusy(true);
    const result = await actions.undoClientImport(importId, { keepWorked: keepWorked && (preview?.worked ?? 0) > 0 });
    setBusy(false);
    if (result.error) {
      toast.error(t("failed"), { description: result.error });
      return;
    }
    toast.success(t("done", { deleted: result.deleted ?? 0, kept: result.kept ?? 0 }));
    handleOpenChange(false);
    onUndone();
  }

  const worked = preview?.worked ?? 0;
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {preview === null ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : preview.error ? (
              preview.error
            ) : (
              t("description", { total: preview.total ?? 0, file: fileName })
            )}
          </DialogDescription>
        </DialogHeader>
        {worked > 0 ? (
          <div className="space-y-3 text-sm">
            <p>{t("worked", { count: worked })}</p>
            <label htmlFor={`${id}-keep`} className="flex cursor-pointer items-center gap-2">
              <Checkbox id={`${id}-keep`} checked={keepWorked} onCheckedChange={(v) => setKeepWorked(v === true)} />
              {t("keepWorked")}
            </label>
          </div>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tCommon("cancel")}</Button>
          </DialogClose>
          <Button variant="destructive" onClick={undo} disabled={busy || preview === null || !!preview.error}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? t("undoing") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
