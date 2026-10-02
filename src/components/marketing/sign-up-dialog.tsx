"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
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
 *
 * An agent who is already signed in has nothing to sign up for: for them the
 * same button is a plain link into the app, as the /login link was before
 * (the proxy sent it on to Home).
 */
export function SignUpDialog({
  children,
  className,
  variant,
  size = "pill",
  next,
}: {
  children: ReactNode;
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  /** Where a new agent lands once in, when not Home: the client tracker opens the import. */
  next?: string;
}) {
  const signedIn = useSignedIn();
  if (signedIn) {
    return (
      <Button asChild size={size} variant={variant} className={className}>
        <Link href={next ?? "/home"}>{children}</Link>
      </Button>
    );
  }
  return (
    <Dialog onOpenChange={(open) => open && trackSiteEvent("signup_open")}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className={className}>
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl px-6 pt-8 pb-6 sm:max-w-sm">
        <SignInForm next={next} Title={DialogTitle} Description={DialogDescription} track logo={false} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Whether this browser holds a session. The public pages are rendered without
 * one (they stay cacheable), so the answer only arrives after hydration: false
 * on the server and on the first paint, and false for good if the lookup
 * fails, which leaves the dialog exactly as a new visitor sees it.
 */
function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let active = true;
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (active && data.session) setSignedIn(true);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);
  return signedIn;
}
