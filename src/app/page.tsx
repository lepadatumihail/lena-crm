import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthErrorListener } from "@/components/auth-error-listener";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <AuthErrorListener />
      <div className="space-y-3">
        <p className="text-primary text-sm font-medium tracking-wide uppercase">
          Lena
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          The CRM for independent real estate agents
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-balance">
          Track buyers and sellers across every agency you work with — leads,
          viewings, offers and documents, all in one place.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/clients">Open the app</Link>
      </Button>
    </main>
  );
}
