"use client";

import { useRef, useState } from "react";
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
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { RowIcon } from "@/components/clients/detail-row";
import { Panel, PanelEmpty } from "@/components/shell/panel";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { useUploadFiles } from "@/components/file-upload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  return (
    <Panel
      title={t("title")}
      icon={<Eye className="size-3.5" />}
      count={viewings.length}
      action={
        <Button variant="outline" size="xs" onClick={() => setAdding(true)}>
          <Plus /> {t("add")}
        </Button>
      }
    >
      {viewings.length === 0 ? (
        <PanelEmpty>{t("empty")}</PanelEmpty>
      ) : (
        <ul className="divide-y">
          {viewings.map((v) => (
            <ViewingCard
              key={v.id}
              clientId={clientId}
              agentId={agentId}
              viewing={v}
            />
          ))}
        </ul>
      )}

      <ViewingDialog
        clientId={clientId}
        open={adding}
        onOpenChange={setAdding}
      />
    </Panel>
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

  const hasMeta = viewing.scheduled_at || viewing.property_price != null;

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <RowIcon icon={Home} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm leading-6 font-medium">
              {viewing.title || t("untitled")}
            </p>
            {viewing.had_offer ? (
              <Tag tone="green" dot className="tabular-nums">
                {t("offer", {
                  price: formatCurrency(viewing.offer_price, intlTag(locale)),
                })}
              </Tag>
            ) : null}
          </div>
          {viewing.description ? (
            <p className="text-muted-foreground text-[13px]">{viewing.description}</p>
          ) : null}
          {hasMeta ? (
            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {viewing.scheduled_at ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" strokeWidth={1.75} />
                  {format(new Date(viewing.scheduled_at), "EEE d MMM, HH:mm", {
                    locale: dateFnsLocale(locale),
                  })}
                </span>
              ) : null}
              {viewing.property_price != null ? (
                <span className="inline-flex items-center gap-1.5">
                  <Euro className="size-3.5" strokeWidth={1.75} />
                  {t.rich("asking", {
                    amount: formatCurrency(viewing.property_price, intlTag(locale)),
                    price: (chunks) => (
                      <span className="text-foreground font-medium tabular-nums">
                        {chunks}
                      </span>
                    ),
                  })}
                </span>
              ) : null}
            </p>
          ) : null}
          {viewing.attachments.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {viewing.attachments.map((a) => (
                <AttachmentRow key={a.id} clientId={clientId} attachment={a} />
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <AttachMenu
            agentId={agentId}
            clientId={clientId}
            onRecord={recordAttachment}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setEditing(true)}
            aria-label={t("editAria")}
          >
            <Pencil />
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
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                aria-label={t("deleteAria")}
              >
                <Trash2 />
              </Button>
            }
          />
        </div>
      </div>

      <ViewingDialog
        clientId={clientId}
        viewing={viewing}
        open={editing}
        onOpenChange={setEditing}
      />
    </li>
  );
}

/** A paperclip menu for a viewing's files: the window card or photos. */
function AttachMenu({
  agentId,
  clientId,
  onRecord,
}: {
  agentId: string;
  clientId: string;
  onRecord: (
    meta: Parameters<typeof addViewingAttachment>[2]
  ) => Promise<boolean>;
}) {
  const t = useTranslations("clientDetail.viewings");
  const cardInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const card = useUploadFiles({
    agentId,
    clientId,
    folder: "viewings",
    successLabel: t("windowCard"),
    onUploaded: (meta) => onRecord({ ...meta, kind: "window_card" }),
  });
  const images = useUploadFiles({
    agentId,
    clientId,
    folder: "viewings",
    successLabel: t("imageLabel"),
    onUploaded: (meta) => onRecord({ ...meta, kind: "image" }),
  });
  const busy = card.uploading || images.uploading;

  return (
    <>
      <input
        ref={cardInput}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void card.handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void images.handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={busy}
            aria-label={t("attach")}
            title={t("attach")}
            className="text-muted-foreground hover:text-foreground data-[state=open]:bg-accent"
          >
            {busy ? <Loader2 className="animate-spin" /> : <Paperclip />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => cardInput.current?.click()}>
            <FileText />
            {t("attachWindowCard")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => imageInput.current?.click()}>
            <ImageIcon />
            {t("attachImages")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
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
    <span className="bg-muted inline-flex h-7 max-w-64 items-center gap-1.5 rounded-md pr-1 pl-2 text-xs">
      {attachment.kind === "window_card" ? (
        <FileText className="text-muted-foreground size-3.5 shrink-0" strokeWidth={1.75} />
      ) : (
        <ImageIcon className="text-muted-foreground size-3.5 shrink-0" strokeWidth={1.75} />
      )}
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="min-w-0 flex-1 truncate text-left font-medium hover:underline"
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
            className="text-muted-foreground hover:bg-background hover:text-destructive flex size-5 shrink-0 items-center justify-center rounded transition-colors duration-150"
            aria-label={t("removeAttachmentAria")}
          >
            <X className="size-3" />
          </button>
        }
      />
    </span>
  );
}
