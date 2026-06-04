"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Info } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

const ADD_BY_URL =
  "https://calendar.google.com/calendar/u/0/r/settings/addbyurl";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

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
        <GoogleIcon /> Sync
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GoogleIcon className="size-5" /> Sync to Google Calendar
          </DialogTitle>
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

          <div className="bg-muted/40 space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">How to add it</p>
            <ol className="text-muted-foreground list-decimal space-y-1.5 pl-5 text-sm">
              <li>Copy the link above.</li>
              <li>
                In Google Calendar, next to “Other calendars”, click{" "}
                <span className="text-foreground font-medium">+ → From URL</span>
                .
              </li>
              <li>Paste the link and add it.</li>
            </ol>
            <a
              href={ADD_BY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full"
              )}
            >
              <GoogleIcon /> Open Google Calendar
            </a>
          </div>

          <div className="text-muted-foreground flex gap-2 text-xs">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <p>
              Subscribed calendars refresh every few hours, so a newly added
              event can take a little while to appear in Google.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
