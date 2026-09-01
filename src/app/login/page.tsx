"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { AuthErrorListener } from "@/components/auth-error-listener";
import { MarketingNav } from "@/components/marketing-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

function safeNext(): string {
  if (typeof window === "undefined") return "/home";
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/home";
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    const next = encodeURIComponent(safeNext());
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  }

  async function sendCode(): Promise<boolean> {
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setSending(false);
    if (error) {
      toast.error("Couldn't send code", { description: error.message });
      return false;
    }
    return true;
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (await sendCode()) {
      setCode("");
      setStep("code");
      toast.success("Code sent", {
        description: `Check ${email} for your 6-digit code.`,
      });
    }
  }

  async function handleResend() {
    if (await sendCode()) {
      setCode("");
      toast.success("New code sent");
    }
  }

  async function handleVerify(value?: string) {
    const token = (value ?? code).trim();
    if (token.length !== 6) return;
    setVerifying(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) {
      setVerifying(false);
      setCode("");
      toast.error("Invalid or expired code", { description: error.message });
      return;
    }
    router.push(safeNext());
    router.refresh();
  }

  return (
    <>
      <MarketingNav variant="minimal" />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <AuthErrorListener />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <p className="text-primary text-sm font-semibold tracking-wide uppercase">
            LeadWing
          </p>
          <CardTitle className="text-2xl">
            {step === "email" ? "Welcome back" : "Enter your code"}
          </CardTitle>
          <CardDescription>
            {step === "email" ? (
              "Sign in to your CRM. No password needed."
            ) : (
              <>
                We emailed a 6-digit code to{" "}
                <span className="text-foreground font-medium">{email}</span>.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" ? (
            <>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </Button>

              <div className="flex items-center gap-3">
                <span className="bg-border h-px flex-1" />
                <span className="text-muted-foreground text-xs">or</span>
                <span className="bg-border h-px flex-1" />
              </div>

              <form onSubmit={handleSendCode} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@agency.com"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={sending || !email}
                >
                  {sending ? <Loader2 className="animate-spin" /> : <Mail />}
                  Email me a code
                </Button>
              </form>
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifying || code.length !== 6}
                >
                  {verifying && <Loader2 className="animate-spin" />}
                  Verify &amp; sign in
                </Button>
              </form>

              <div className="flex items-center justify-between">
                <Button
                  variant="link"
                  size="sm"
                  className="px-0"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                  }}
                  disabled={verifying}
                >
                  <ArrowLeft className="size-3.5" /> Different email
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  className="px-0"
                  onClick={handleResend}
                  disabled={sending || verifying}
                >
                  Resend code
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </main>
    </>
  );
}
