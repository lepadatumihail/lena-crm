"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const MODES = [
  { value: "buyer", label: "Buyers" },
  { value: "seller", label: "Sellers" },
] as const;

export function ModeToggle() {
  const params = useSearchParams();
  const active = params.get("side") === "seller" ? "seller" : "buyer";

  return (
    <div className="bg-muted inline-flex rounded-lg p-0.5">
      {MODES.map((m) => (
        <Link
          key={m.value}
          href={`/clients?side=${m.value}`}
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium transition-colors",
            active === m.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {m.label}
        </Link>
      ))}
    </div>
  );
}
