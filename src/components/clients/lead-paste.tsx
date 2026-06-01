"use client";

import { useState } from "react";
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
}: {
  onApply: (data: ExtractedLead) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function extract() {
    if (!text.trim()) return;
    setLoading(true);
    const { data, error } = await extractLead(text);
    setLoading(false);
    if (error || !data) {
      toast.error("Couldn't read that lead", {
        description: error ?? undefined,
      });
      return;
    }
    onApply(data);
    toast.success("Filled from the lead — review and save");
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
          <span className="block text-sm font-medium">
            Paste a lead to auto-fill
          </span>
          <span className="text-muted-foreground block text-xs">
            From Idealista, an email or WhatsApp — AI fills the form for you.
          </span>
        </span>
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paste a lead</DialogTitle>
          <DialogDescription>
            Drop in the raw inquiry — a portal message, forwarded email or
            WhatsApp text — and AI pulls out the details.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Hi, I saw your listing on Idealista. My name is Anya Petrova, I'm after a 2-bed apartment in Marbella up to €600,000. You can reach me on +34 600 123 456…"
        />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={extract}
            disabled={loading || !text.trim()}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Extract details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
