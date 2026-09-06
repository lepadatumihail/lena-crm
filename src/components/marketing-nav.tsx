import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export function MarketingNav({
  variant = "landing",
}: {
  variant?: "landing" | "minimal";
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          {variant === "landing" ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="#how-it-works">How it works</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="#pricing">Pricing</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft /> Back to home
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
