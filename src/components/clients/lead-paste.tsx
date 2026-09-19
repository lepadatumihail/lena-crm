"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { extractLead, type ExtractedLead } from "@/lib/actions/leads";

export function LeadPaste({
  onApply,
  defaultOpen = false,
}: {
  onApply: (data: ExtractedLead) => void;
  /** Open the dialog on arrival, for a link that came here to paste. */
  defaultOpen?: boolean;
}) {
  const t = useTranslations("clients.leadPaste");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function extract() {
    if (!text.trim()) return;
    setLoading(true);
    const { data, error } = await extractLead(text);
    setLoading(false);
    if (error || !data) {
      toast.error(t("toasts.failed"), {
        description: error ?? undefined,
      });
      return;
    }
    onApply(data);
    toast.success(t("toasts.filled"));
    setOpen(false);
    setText("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-primary/40 bg-primary/5 hover:bg-primary/10 flex w-full items-center gap-3 rounded-xl border border-dashed p-4 text-left transition-colors"
      >
        <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Sparkles className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">{t("triggerTitle")}</span>
          <span className="text-muted-foreground block text-xs">
            {t("triggerDescription")}
          </span>
        </span>
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <Textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
        />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            onClick={extract}
            disabled={loading || !text.trim()}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {t("extract")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
