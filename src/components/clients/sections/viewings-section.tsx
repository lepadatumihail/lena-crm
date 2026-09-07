"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CalendarClock,
  Euro,
  Eye,
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
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
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
  const t = useTranslations("clientDetail.viewings");
  const [adding, setAdding] = useState(false);
  const offerCount = viewings.filter((v) => v.had_offer).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="text-primary size-4" />
          {t("title")}
        </CardTitle>
          {viewings.length > 0 && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {t("summary", { count: viewings.length, offers: offerCount })}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus /> {t("add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {viewings.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
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
  const t = useTranslations("clientDetail.viewings");
  const locale = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function onDelete() {
    const { error } = await deleteViewing(clientId, viewing.id);
    if (error) {
      toast.error(t("deleteError"), { description: error });
      return false;
    }
    toast.success(t("deleted"));
    router.refresh();
    return true;
  }

  async function recordAttachment(
    meta: Parameters<typeof addViewingAttachment>[2]
  ) {
    const { error } = await addViewingAttachment(clientId, viewing.id, meta);
    if (error) {
      toast.error(t("attachmentError"), { description: error });
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
                {viewing.title || t("untitled")}
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
              aria-label={t("editAria")}
            >
              <Pencil className="size-4" />
            </Button>
            <ConfirmDialog
              title={t("confirmTitle")}
              description={t("confirmDescription", {
                title: viewing.title || t("untitled"),
              })}
              onConfirm={onDelete}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive size-8"
                  aria-label={t("deleteAria")}
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
                {format(new Date(viewing.scheduled_at), "EEE d MMM, HH:mm", {
                  locale: dateFnsLocale(locale),
                })}
              </span>
            )}
            {viewing.property_price != null && (
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Euro className="size-4 opacity-70" />
                {t.rich("asking", {
                  amount: formatCurrency(
                    viewing.property_price,
                    intlTag(locale)
                  ),
                  price: (chunks) => (
                    <span className="text-foreground font-medium tabular-nums">
                      {chunks}
                    </span>
                  ),
                })}
              </span>
            )}
            {viewing.had_offer && (
              <Badge variant="success" className="tabular-nums">
                {t("offer", {
                  price: formatCurrency(viewing.offer_price, intlTag(locale)),
                })}
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
            successLabel={t("windowCard")}
            onUploaded={(meta) =>
              recordAttachment({ ...meta, kind: "window_card" })
            }
          >
            {t("windowCard")}
          </UploadButton>
          <UploadButton
            agentId={agentId}
            clientId={clientId}
            folder="viewings"
            accept="image/*"
            successLabel={t("imageLabel")}
            onUploaded={(meta) => recordAttachment({ ...meta, kind: "image" })}
          >
            {t("images")}
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
  const t = useTranslations("clientDetail.viewings");
  const tCommon = useTranslations("common");
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
      toast.error(t("openError"));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function remove() {
    const { error } = await deleteViewingAttachment(clientId, attachment.id);
    if (error) {
      toast.error(t("removeError"), { description: error });
      return false;
    }
    toast.success(t("attachmentRemoved"));
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
        title={t("removeAttachmentTitle")}
        description={t("removeAttachmentDescription", {
          name: attachment.file_name,
        })}
        confirmLabel={tCommon("remove")}
        onConfirm={remove}
        trigger={
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive shrink-0"
            aria-label={t("removeAttachmentAria")}
          >
            <Trash2 className="size-3.5" />
          </button>
        }
      />
    </div>
  );
}
