"use client";

import type { ComponentProps, ReactNode } from "react";

import { trackSiteEvent } from "@/lib/site-events";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * The sign-up call to action on the public pages (the marketing header, the
 * home page, the ad landings): signing up happens in a dialog on the page the
 * visitor is reading, not on a second page. Every extra page loses visitors
 * on a phone, and the plain /login link used to drop an ad's utm tags; here
 * the form reads them straight from this page. Opening the dialog is a funnel
 * step of its own. The page around it is already ours, so the form inside
 * skips the logo.
 */
export function SignUpDialog({
  children,
  className,
  variant,
  size = "pill",
}: {
  children: ReactNode;
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
}) {
  return (
    <Dialog onOpenChange={(open) => open && trackSiteEvent("signup_open")}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className={className}>
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl px-6 pt-8 pb-6 sm:max-w-sm">
        <SignInForm Title={DialogTitle} Description={DialogDescription} track logo={false} />
      </DialogContent>
    </Dialog>
  );
}
