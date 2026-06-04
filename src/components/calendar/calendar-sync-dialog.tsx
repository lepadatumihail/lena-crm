"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCalendarFeedToken } from "@/lib/actions/calendar";

export function CalendarSyncDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !url) {
      setLoading(true);
      const { token, error } = await getCalendarFeedToken();
      setLoading(false);
      if (error || !token) {
        toast.error("Couldn't generate your sync link", {
          description: error ?? undefined,
        });
        return;
      }
      setUrl(`${window.location.origin}/api/calendar/${token}.ics`);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — select and copy manually");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        <RefreshCw /> Sync
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync to Google Calendar</DialogTitle>
          <DialogDescription>
            Subscribe once and your viewings &amp; meetings appear in Google
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Your private calendar link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={loading ? "Generating…" : url}
                onFocus={(e) => e.currentTarget.select()}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copy}
                disabled={!url}
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="text-success size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Keep this link private — anyone with it can see your schedule.
            </p>
          </div>

          <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
            <li>Open Google Calendar on desktop.</li>
            <li>
              Next to “Other calendars”, click{" "}
              <span className="text-foreground font-medium">+ → From URL</span>.
            </li>
            <li>Paste the link above and add it.</li>
          </ol>

          <p className="text-muted-foreground text-xs">
            Google refreshes subscribed calendars every few hours, so new events
            can take a little while to show. Prefer adding events one by one?
            Use the “Add to Google” button on each event instead — but don’t do
            both, or they’ll appear twice.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
