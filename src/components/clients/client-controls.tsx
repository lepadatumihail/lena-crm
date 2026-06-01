"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  deleteClient,
  setClientActive,
  setClientPriority,
  updateClientStage,
} from "@/lib/actions/clients";
import {
  clientFullName,
  clientsPath,
  STAGE_LABELS,
  stagesForSide,
  type ClientSide,
} from "@/lib/crm";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/supabase/types";

export function ClientControls({ client }: { client: Client }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const side = client.side as ClientSide;

  function changeStage(stage: string) {
    startTransition(async () => {
      const { error } = await updateClientStage(client.id, stage);
      if (error) toast.error("Couldn't change stage", { description: error });
      else {
        toast.success("Stage updated");
        router.refresh();
      }
    });
  }

  function togglePriority() {
    startTransition(async () => {
      const { error } = await setClientPriority(client.id, !client.priority);
      if (error)
        toast.error("Couldn't update priority", { description: error });
      else router.refresh();
    });
  }

  function toggleActive(next: boolean) {
    startTransition(async () => {
      const { error } = await setClientActive(client.id, next);
      if (error) toast.error("Couldn't update", { description: error });
      else {
        toast.success(next ? "Client reactivated" : "Client hidden");
        router.refresh();
      }
    });
  }

  async function onDelete() {
    setDeleting(true);
    const { error } = await deleteClient(client.id);
    if (error) {
      setDeleting(false);
      toast.error("Couldn't delete client", { description: error });
      return;
    }
    toast.success("Client deleted");
    router.push(clientsPath(side));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={client.stage} onValueChange={changeStage}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {stagesForSide(side).map((s) => (
            <SelectItem key={s} value={s}>
              {STAGE_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={togglePriority}
        disabled={pending}
        aria-label={client.priority ? "Unflag priority" : "Flag priority"}
      >
        <Star
          className={cn(
            "size-4",
            client.priority && "fill-warning text-warning"
          )}
        />
      </Button>

      <Button asChild variant="outline">
        <Link href={`/clients/${client.id}/edit`}>
          <Pencil /> Edit
        </Link>
      </Button>

      <div className="flex h-9 items-center gap-2 rounded-md border px-3">
        <Switch
          id="active"
          checked={client.is_active}
          onCheckedChange={toggleActive}
          disabled={pending}
        />
        <Label htmlFor="active" className="text-muted-foreground text-sm">
          Active
        </Label>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive ml-auto"
            aria-label="Delete client"
          >
            <Trash2 className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete client?</DialogTitle>
            <DialogDescription>
              This permanently deletes {clientFullName(client)} and all their
              data — preferences, viewings, offers and documents. This can&apos;t
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
