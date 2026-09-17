"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ClientSide } from "@/lib/crm";
import { SessionEndedError, downloadFrom } from "@/lib/download";
import { cn } from "@/lib/utils";

export type ExportFormat = "xlsx" | "csv";

/**
 * Download the given clients as a spreadsheet. `ids` are the rows in view; the
 * server re-reads each one in full and keeps their order.
 */
export function ExportMenu({
  side,
  ids,
  disabled = false,
  variant = "toolbar",
}: {
  side: ClientSide;
  ids: string[];
  disabled?: boolean;
  /** "toolbar": the icon button above the list. "bulk": the text button in the selection bar. */
  variant?: "toolbar" | "bulk";
}) {
  const t = useTranslations("clients.export");
  const [busy, setBusy] = useState(false);

  async function download(format: ExportFormat) {
    setBusy(true);
    try {
      await downloadFrom(
        "/clients/export",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ side, format, ids }),
        },
        `leadwing-${side}s.${format}`
      );
    } catch (error) {
      if (error instanceof SessionEndedError) toast.error(t("sessionEnded"));
      else {
        toast.error(t("failed"), {
          description: error instanceof Error && error.message ? error.message : undefined,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const Icon = busy ? Loader2 : Download;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled || busy || ids.length === 0}
        aria-label={variant === "toolbar" ? t("label") : undefined}
        title={variant === "toolbar" ? t("label") : undefined}
        className={cn(
          "inline-flex shrink-0 items-center justify-center outline-none transition-[color,background-color,scale] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50",
          variant === "toolbar"
            ? "bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground size-8 rounded-lg border shadow-xs [&_svg]:size-4"
            : "hover:bg-muted text-foreground h-7 gap-1.5 rounded-md px-2 text-xs font-medium [&_svg]:size-3.5"
        )}
      >
        <Icon className={cn(busy && "animate-spin")} strokeWidth={1.75} />
        {variant === "bulk" ? t("selected") : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={variant === "toolbar" ? "end" : "start"} className="min-w-44">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          {t("count", { side, count: ids.length })}
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => download("xlsx")}>
          {t("excel")}
          <span className="text-muted-foreground ml-auto text-xs">{t("default")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => download("csv")}>{t("csv")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
