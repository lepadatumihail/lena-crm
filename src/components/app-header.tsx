import { Suspense } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/clients" className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-sm font-bold">
            L
          </span>
          <span className="hidden font-semibold tracking-tight sm:inline">
            Lena
          </span>
        </Link>

        <div className="flex-1">
          <Suspense fallback={null}>
            <ModeToggle />
          </Suspense>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground hidden max-w-[12rem] truncate text-sm md:inline">
            {email}
          </span>
          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
