import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MarketingNav({
  variant = "landing",
}: {
  variant?: "landing" | "minimal";
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-sm font-bold">
            L
          </span>
          <span className="font-semibold tracking-tight">Lena</span>
        </Link>
        <div className="flex items-center gap-2">
          {variant === "landing" ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="#features">How it works</Link>
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
