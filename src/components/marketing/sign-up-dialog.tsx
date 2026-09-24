"use client";

import type { ReactNode } from "react";

import { trackSiteEvent } from "@/lib/site-events";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * The ad landings' call to action: signing up happens in a dialog on the page
 * the ad opened, not on a second page. Every extra page loses visitors on a
 * phone, and the plain /login link used to drop the ad's utm tags; here the
 * form reads them straight from this page. Opening the dialog is a funnel
 * step of its own.
 */
export function SignUpDialog({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Dialog onOpenChange={(open) => open && trackSiteEvent("signup_open")}>
      <DialogTrigger asChild>
        <Button size="pill" className={className}>
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl px-6 pt-8 pb-6 sm:max-w-sm">
        <SignInForm Title={DialogTitle} Description={DialogDescription} track />
      </DialogContent>
    </Dialog>
  );
}
