"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tagVariants } from "@/components/ui/tag";
import {
  deleteClient,
  setClientActive,
  setClientPriority,
  updateClientStage,
} from "@/lib/actions/clients";
import { stageLabel } from "@/i18n/labels";
import {
  clientFullName,
  clientsPath,
  stagesForSide,
  STAGE_TONES,
  type ClientSide,
  type Stage,
} from "@/lib/crm";
import { TONE_SOLID, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/supabase/types";

/**
 * The stage pill one step darker while it is hovered or open, so it reads as
 * a control. Per tone, because the pills differ: an outline, a grey fill, a
 * pale colour, or solid ink.
 */
const STAGE_PILL_HOVER: Record<Tone, string> = {
  neutral: "hover:bg-muted data-[state=open]:bg-muted",
  grey: "hover:bg-foreground/10 data-[state=open]:bg-foreground/10",
  blue: "hover:bg-tone-blue/20 data-[state=open]:bg-tone-blue/20",
  green: "hover:bg-tone-green/20 data-[state=open]:bg-tone-green/20",
  amber: "hover:bg-tone-amber/25 data-[state=open]:bg-tone-amber/25",
  red: "hover:bg-tone-red/20 data-[state=open]:bg-tone-red/20",
  violet: "hover:bg-tone-violet/20 data-[state=open]:bg-tone-violet/20",
  ink: "hover:bg-foreground/85 data-[state=open]:bg-foreground/85",
};

/**
 * The stage tag under the client's name, which is also the way to change
 * it: one place shows the stage, the same place moves it. Updates
 * optimistically; the action revalidates the page.
 */
export function StageMenu({
  clientId,
  stage,
  side,
}: {
  clientId: string;
  stage: string;
  side: ClientSide;
}) {
  const t = useTranslations("clients");
  const tCrm = useTranslations("crm");
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(stage);
  const tone = STAGE_TONES[current as Stage] ?? "neutral";

  function change(next: string) {
    if (next === current) return;
    startTransition(async () => {
      setCurrent(next);
      const { error } = await updateClientStage(clientId, next);
      if (error) {
        toast.error(t("controls.toasts.stageFailed"), { description: error });
        return;
      }
      toast.success(t("list.toasts.moved", { stage: stageLabel(tCrm, next) }));
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          tagVariants({ tone }),
          "cursor-pointer pr-1.5 outline-none transition-[background-color,box-shadow] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50",
          STAGE_PILL_HOVER[tone]
        )}
      >
        <span className="sr-only">{t("table.stage")}: </span>
        {stageLabel(tCrm, current)}
        <ChevronDown aria-hidden className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          {t("rowMenu.moveTo")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current} onValueChange={change}>
          {stagesForSide(side).map((s) => (
            // The stage's own dot leads; the radio's dot would sit beside it
            // (two dots on the current row), so it is hidden for a check at the end.
            <DropdownMenuRadioItem
              key={s}
              value={s}
              className="group/stage pl-2 [&>span:first-child]:hidden"
            >
              <span
                aria-hidden
                className={cn("size-2 shrink-0 rounded-full", TONE_SOLID[STAGE_TONES[s]])}
              />
              {stageLabel(tCrm, s)}
              <Check
                aria-hidden
                className="text-foreground ml-auto size-3.5 opacity-0 group-data-[state=checked]/stage:opacity-100"
              />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The client page's actions: Edit, the primary action passed in (the
 * message composer), and a menu for the rarer moves: priority,
 * hide/reactivate and delete.
 */
export function ClientHeaderActions({
  client,
  primary,
}: {
  client: Client;
  primary?: ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const side = client.side as ClientSide;

  function togglePriority() {
    startTransition(async () => {
      const { error } = await setClientPriority(client.id, !client.priority);
      if (error) toast.error(t("controls.toasts.priorityFailed"), { description: error });
      else router.refresh();
    });
  }

  function toggleActive(next: boolean) {
    startTransition(async () => {
      const { error } = await setClientActive(client.id, next);
      if (error) toast.error(t("controls.toasts.updateFailed"), { description: error });
      else {
        toast.success(
          next ? t("controls.toasts.reactivated") : t("controls.toasts.hidden")
        );
        router.refresh();
      }
    });
  }

  async function onDelete() {
    setDeleting(true);
    const { error } = await deleteClient(client.id);
    if (error) {
      setDeleting(false);
      toast.error(t("controls.toasts.deleteFailed"), { description: error });
      return;
    }
    toast.success(t("controls.toasts.deleted"));
    router.push(clientsPath(side));
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/clients/${client.id}/edit`}>
          <Pencil /> {tCommon("edit")}
        </Link>
      </Button>
      {primary}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t("table.actions")}
            disabled={pending}
            className="data-[state=open]:bg-accent"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={togglePriority}>
            <Star className={cn(client.priority && "fill-foreground text-foreground")} />
            {client.priority ? t("priority.unflag") : t("priority.flag")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toggleActive(!client.is_active)}>
            {client.is_active ? <EyeOff /> : <RotateCcw />}
            {client.is_active ? t("rowMenu.hide") : t("rowMenu.reactivate")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 />
            {t("controls.deleteClient")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("controls.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("controls.deleteDescription", { name: clientFullName(client) })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{tCommon("cancel")}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting && <Loader2 className="animate-spin" />}
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
