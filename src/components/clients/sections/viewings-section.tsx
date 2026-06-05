"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CalendarClock,
  Euro,
  FileText,
  Home,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadButton } from "@/components/file-upload";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ViewingDialog } from "@/components/clients/viewing-dialog";
import {
  addViewingAttachment,
  deleteViewing,
  deleteViewingAttachment,
} from "@/lib/actions/buyer";
import { formatCurrency } from "@/lib/crm";
import { createClient } from "@/lib/supabase/client";
import type { ViewingWithAttachments } from "@/lib/data/buyer";
import type { ViewingAttachment } from "@/lib/supabase/types";

export function ViewingsSection({
  clientId,
  agentId,
  viewings,
}: {
  clientId: string;
  agentId: string;
  viewings: ViewingWithAttachments[];
}) {
  const [adding, setAdding] = useState(false);
  const offerCount = viewings.filter((v) => v.had_offer).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Viewings</CardTitle>
          {viewings.length > 0 && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {viewings.length} viewed · {offerCount} with an offer
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus /> Add viewing
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {viewings.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No viewings yet. Add properties this buyer has viewed.
          </p>
        ) : (
          viewings.map((v) => (
            <ViewingCard
              key={v.id}
              clientId={clientId}
              agentId={agentId}
              viewing={v}
            />
          ))
        )}
      </CardContent>

      <ViewingDialog
        clientId={clientId}
        open={adding}
        onOpenChange={setAdding}
      />
    </Card>
  );
}

function ViewingCard({
  clientId,
  agentId,
  viewing,
}: {
  clientId: string;
  agentId: string;
  viewing: ViewingWithAttachments;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function onDelete() {
    const { error } = await deleteViewing(clientId, viewing.id);
    if (error) {
      toast.error("Couldn't delete viewing", { description: error });
      return false;
    }
    toast.success("Viewing deleted");
    router.refresh();
    return true;
  }

  async function recordAttachment(
    meta: Parameters<typeof addViewingAttachment>[2]
  ) {
    const { error } = await addViewingAttachment(clientId, viewing.id, meta);
    if (error) {
      toast.error("Couldn't save attachment", { description: error });
      return false;
    }
    return true;
  }

  const hasMeta =
    viewing.scheduled_at ||
    viewing.property_price != null ||
    viewing.had_offer;

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <span className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Home className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="leading-tight font-medium">
                {viewing.title || "Untitled property"}
              </p>
              {viewing.description && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {viewing.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setEditing(true)}
              aria-label="Edit viewing"
            >
              <Pencil className="size-4" />
            </Button>
            <ConfirmDialog
              title="Delete viewing?"
              description={`This removes “${
                viewing.title || "Untitled property"
              }” and its attachments. This can’t be undone.`}
              onConfirm={onDelete}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive size-8"
                  aria-label="Delete viewing"
                >
                  <Trash2 className="size-4" />
                </Button>
              }
            />
          </div>
        </div>

        {hasMeta && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-11 text-sm">
            {viewing.scheduled_at && (
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CalendarClock className="size-4 opacity-70" />
                {format(new Date(viewing.scheduled_at), "EEE d MMM, HH:mm")}
              </span>
            )}
            {viewing.property_price != null && (
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Euro className="size-4 opacity-70" />
                Asking{" "}
                <span className="text-foreground font-medium tabular-nums">
                  {formatCurrency(viewing.property_price)}
                </span>
              </span>
            )}
            {viewing.had_offer && (
              <Badge variant="success" className="tabular-nums">
                Offer {formatCurrency(viewing.offer_price)}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Files & actions — visually delimited footer */}
      <div className="bg-muted/30 border-t px-3 py-3 sm:px-4">
        {viewing.attachments.length > 0 && (
          <div className="mb-2.5 space-y-1.5">
            {viewing.attachments.map((a) => (
              <AttachmentRow key={a.id} clientId={clientId} attachment={a} />
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <UploadButton
            agentId={agentId}
            clientId={clientId}
            folder="viewings"
            accept="application/pdf"
            multiple={false}
            successLabel="Window card"
            onUploaded={(meta) =>
              recordAttachment({ ...meta, kind: "window_card" })
            }
          >
            Window card
          </UploadButton>
          <UploadButton
            agentId={agentId}
            clientId={clientId}
            folder="viewings"
            accept="image/*"
            successLabel="Image"
            onUploaded={(meta) => recordAttachment({ ...meta, kind: "image" })}
          >
            Images
          </UploadButton>
        </div>
      </div>

      <ViewingDialog
        clientId={clientId}
        viewing={viewing}
        open={editing}
        onOpenChange={setEditing}
      />
    </div>
  );
}

function AttachmentRow({
  clientId,
  attachment,
}: {
  clientId: string;
  attachment: ViewingAttachment;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(attachment.storage_path, 60);
    setBusy(false);
    if (error || !data) {
      toast.error("Couldn't open file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function remove() {
    const { error } = await deleteViewingAttachment(clientId, attachment.id);
    if (error) {
      toast.error("Couldn't remove", { description: error });
      return false;
    }
    toast.success("Attachment removed");
    router.refresh();
    return true;
  }

  return (
    <div className="bg-background flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm">
      {attachment.kind === "window_card" ? (
        <FileText className="text-muted-foreground size-4 shrink-0" />
      ) : (
        <ImageIcon className="text-muted-foreground size-4 shrink-0" />
      )}
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="min-w-0 flex-1 truncate text-left hover:underline"
      >
        {attachment.file_name}
      </button>
      <ConfirmDialog
        title="Remove attachment?"
        description={`“${attachment.file_name}” will be removed from this viewing.`}
        confirmLabel="Remove"
        onConfirm={remove}
        trigger={
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive shrink-0"
            aria-label="Remove attachment"
          >
            <Trash2 className="size-3.5" />
          </button>
        }
      />
    </div>
  );
}
