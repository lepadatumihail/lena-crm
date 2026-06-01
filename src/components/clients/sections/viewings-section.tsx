"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  FileText,
  ImageIcon,
  Loader2,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UploadButton } from "@/components/file-upload";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  deleteViewing,
  deleteViewingAttachment,
  addViewingAttachment,
  saveViewing,
} from "@/lib/actions/buyer";
import {
  viewingFormSchema,
  type ViewingFormValues,
} from "@/lib/validation/buyer";
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

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">
            {viewing.title || "Untitled property"}
          </p>
          {viewing.description && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {viewing.description}
            </p>
          )}
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

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {viewing.property_price != null && (
          <span className="text-muted-foreground">
            Asking{" "}
            <span className="text-foreground font-medium">
              {formatCurrency(viewing.property_price)}
            </span>
          </span>
        )}
        {viewing.had_offer && (
          <Badge variant="success">
            Offer {formatCurrency(viewing.offer_price)}
          </Badge>
        )}
      </div>

      {viewing.attachments.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {viewing.attachments.map((a) => (
            <AttachmentRow key={a.id} clientId={clientId} attachment={a} />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
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
    <div className="bg-muted/40 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
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

function ViewingDialog({
  clientId,
  viewing,
  open,
  onOpenChange,
}: {
  clientId: string;
  viewing?: ViewingWithAttachments;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ViewingFormValues>({
    resolver: zodResolver(viewingFormSchema),
    defaultValues: {
      title: viewing?.title ?? "",
      description: viewing?.description ?? "",
      property_price:
        viewing?.property_price != null ? String(viewing.property_price) : "",
      had_offer: viewing?.had_offer ?? false,
      offer_price:
        viewing?.offer_price != null ? String(viewing.offer_price) : "",
    },
  });

  const hadOffer = form.watch("had_offer");

  async function onSubmit(values: ViewingFormValues) {
    setSubmitting(true);
    const { error } = await saveViewing(clientId, viewing?.id ?? null, values);
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't save viewing", { description: error });
      return;
    }
    toast.success(viewing ? "Viewing updated" : "Viewing added");
    onOpenChange(false);
    if (!viewing) form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{viewing ? "Edit viewing" : "Add viewing"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="3-bed apartment, Nueva Andalucía"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Notes about the property…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="property_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asking price (€)</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="750000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="had_offer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="had_offer">Made an offer</Label>
                  <FormControl>
                    <Switch
                      id="had_offer"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {hadOffer && (
              <FormField
                control={form.control}
                name="offer_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer price (€)</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="710000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                {viewing ? "Save" : "Add viewing"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
