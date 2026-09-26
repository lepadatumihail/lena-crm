"use client";

import { useState, useSyncExternalStore, type ElementType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { syncLocaleFromProfile } from "@/i18n/actions";
import { asLocale } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { isInAppBrowser } from "@/lib/in-app-browser";
import { readSignupSource } from "@/lib/signup-source";
import { trackSiteEvent, type SiteEvent } from "@/lib/site-events";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Logo } from "@/components/brand/logo";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

const noSubscribe = () => () => {};

/** True inside the Facebook/Instagram/etc. in-app browsers; false during server render. */
function useInAppBrowser(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => isInAppBrowser(navigator.userAgent),
    () => false
  );
}

/**
 * Google or an emailed 6-digit code, then the code step. The same form serves
 * the /login page and the sign-up dialog on the ad landings, which pass their
 * own title elements (a card heading, a dialog title) so each is announced
 * properly. Inside an in-app browser, where Google refuses to sign anyone in,
 * only the code is offered. Whatever utm tags the page carries go with the
 * sign-up, so a new profile records the ad that brought it.
 */
export function SignInForm({
  next = "/home",
  Title,
  Description,
  track = false,
  className,
}: {
  /** Where to go once signed in (already checked to be a local path). */
  next?: string;
  Title: ElementType;
  Description: ElementType;
  /** Log the anonymous funnel steps (the ad landings do). */
  track?: boolean;
  className?: string;
}) {
  const t = useTranslations("auth.login");
  const locale = asLocale(useLocale());
  const router = useRouter();
  const inApp = useInAppBrowser();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const log = (event: SiteEvent) => {
    if (track) trackSiteEvent(event);
  };
  const source = () => readSignupSource(window.location.search, window.location.pathname);

  async function handleGoogle() {
    setGoogleLoading(true);
    log("google_start");
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", next);
    const src = source();
    if (src) callback.searchParams.set("src", JSON.stringify(src));
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  }

  async function sendCode(): Promise<boolean> {
    setSending(true);
    const src = source();
    const { error } = await createClient().auth.signInWithOtp({
      email,
      // `data` only lands on a new user; the database copies it onto the profile.
      options: { shouldCreateUser: true, ...(src ? { data: { signup_source: src } } : {}) },
    });
    setSending(false);
    if (error) {
      toast.error(t("toasts.sendFailed"), { description: error.message });
      return false;
    }
    log("code_sent");
    return true;
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (await sendCode()) {
      setCode("");
      setStep("code");
      toast.success(t("toasts.codeSent"), {
        description: t("toasts.codeSentDescription", { email }),
      });
    }
  }

  async function handleResend() {
    if (await sendCode()) {
      setCode("");
      toast.success(t("toasts.newCodeSent"));
    }
  }

  async function handleVerify(value?: string) {
    const token = (value ?? code).trim();
    if (token.length !== 6) return;
    setVerifying(true);
    const { error } = await createClient().auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      setVerifying(false);
      setCode("");
      toast.error(t("toasts.invalidCode"), { description: error.message });
      return;
    }
    log("signed_in");
    // Best effort: a new device adopts the language saved on the profile.
    await syncLocaleFromProfile().catch(() => null);
    router.push(next);
    router.refresh();
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-1.5 text-center">
        <Logo className="mx-auto mb-3 text-lg" markClassName="size-8" />
        <Title className="text-2xl leading-none font-semibold">
          {step === "email" ? t("title") : t("codeTitle")}
        </Title>
        <Description className="text-muted-foreground text-sm text-balance">
          {step === "email"
            ? t("description")
            : t.rich("codeDescription", {
                address: email,
                email: (chunks) => <span className="text-foreground font-medium">{chunks}</span>,
              })}
        </Description>
      </div>

      <div className="space-y-4">
        {step === "email" ? (
          <>
            {!inApp && (
              <>
                <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={googleLoading}>
                  {googleLoading ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
                  {t("google")}
                </Button>

                <div className="flex items-center gap-3">
                  <span className="bg-border h-px flex-1" />
                  <span className="text-muted-foreground text-xs">{t("or")}</span>
                  <span className="bg-border h-px flex-1" />
                </div>
              </>
            )}

            <form onSubmit={handleSendCode} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder={t("emailPlaceholder")}
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {/* Enabled while the field is empty: the input's own required
                  and type=email checks say what is missing, where a disabled
                  ink button would sit in the card as a flat grey slab. */}
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? <Loader2 className="animate-spin" /> : <Mail />}
                {t("sendCode")}
              </Button>
            </form>

            {inApp && (
              <p className="text-muted-foreground text-center text-xs text-balance">{t("inAppNote")}</p>
            )}

            <p className="text-muted-foreground text-center text-sm text-balance">{t("freeNote")}</p>

            <p className="text-muted-foreground text-center text-xs text-balance">
              {t.rich("legal", {
                terms: (chunks) => (
                  <Link href={marketingPath("terms", locale)} className="hover:text-foreground underline underline-offset-4">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href={marketingPath("privacy", locale)} className="hover:text-foreground underline underline-offset-4">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleVerify();
              }}
              className="flex flex-col items-center gap-4"
            >
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                onComplete={(v) => void handleVerify(v)}
                disabled={verifying}
                autoFocus
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <Button type="submit" className="w-full" disabled={verifying || code.length !== 6}>
                {verifying && <Loader2 className="animate-spin" />}
                {t("verify")}
              </Button>
            </form>

            <div className="flex items-center justify-between">
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground hover:text-foreground px-0 font-normal"
                onClick={() => {
                  setStep("email");
                  setCode("");
                }}
                disabled={verifying}
              >
                <ArrowLeft className="size-3.5" /> {t("differentEmail")}
              </Button>
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground hover:text-foreground px-0 font-normal"
                onClick={handleResend}
                disabled={sending || verifying}
              >
                {t("resend")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
