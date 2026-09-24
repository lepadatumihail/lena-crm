"use client";

import { AuthErrorListener } from "@/components/auth-error-listener";
import { SignInForm } from "@/components/auth/sign-in-form";
import { MarketingNav } from "@/components/marketing-nav";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

function safeNext(): string {
  if (typeof window === "undefined") return "/home";
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/home";
}

export default function LoginPage() {
  return (
    <>
      <MarketingNav variant="minimal" />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <AuthErrorListener />
        <Card className="w-full max-w-sm">
          <CardContent>
            <SignInForm next={safeNext()} Title={CardTitle} Description={CardDescription} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
