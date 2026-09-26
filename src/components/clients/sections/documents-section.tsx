"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { File as FileIcon, FolderOpen, Trash2 } from "lucide-react";

import { RowIcon } from "@/components/shell/key-value";
import { Panel, PanelEmpty } from "@/components/shell/panel";
import { Button } from "@/components/ui/button";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import { UploadButton } from "@/components/file-upload";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { addDocument, deleteDocument } from "@/lib/actions/documents";
import { createClient } from "@/lib/supabase/client";
import type { DocumentRow } from "@/lib/supabase/types";

/** "1.2 MB" / "1,2 MB": the decimal mark follows the language. */
function formatBytes(bytes: number | null, locale: string) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  const digits = n < 10 && i > 0 ? 1 : 0;
  const value = new Intl.NumberFormat(intlTag(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
  return `${value} ${units[i]}`;
}

export function DocumentsSection({
  clientId,
  agentId,
  documents,
}: {
  clientId: string;
  agentId: string;
  documents: DocumentRow[];
}) {
  const t = useTranslations("clientDetail.documents");

  return (
    <Panel
      title={t("title")}
      icon={<FolderOpen className="size-3.5" />}
      count={documents.length}
      action={
        // A ghost button takes its text colour from here: muted, like the
        // other panel actions.
        <span className="text-muted-foreground -mr-1.5 inline-flex">
          <UploadButton
            agentId={agentId}
            clientId={clientId}
            folder="documents"
            variant="ghost"
            size="xs"
            successLabel={t("uploadLabel")}
            onUploaded={async (meta) => {
              const { error } = await addDocument(clientId, meta);
              if (error) {
                toast.error(t("saveError"), { description: error });
                return false;
              }
              return true;
            }}
          >
            {t("upload")}
          </UploadButton>
        </span>
      }
    >
      {documents.length === 0 ? (
        <PanelEmpty>{t("empty")}</PanelEmpty>
      ) : (
        <ul className="divide-y">
          {documents.map((d) => (
            <DocumentRowItem key={d.id} clientId={clientId} doc={d} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function DocumentRowItem({
  clientId,
  doc,
}: {
  clientId: string;
  doc: DocumentRow;
}) {
  const t = useTranslations("clientDetail.documents");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(doc.storage_path, 60);
    setBusy(false);
    if (error || !data) {
      toast.error(t("openError"));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function remove() {
    const { error } = await deleteDocument(clientId, doc.id);
    if (error) {
      toast.error(t("deleteError"), { description: error });
      return false;
    }
    toast.success(t("deleted"));
    router.refresh();
    return true;
  }

  return (
    <li className="flex items-center gap-3 px-4 py-2">
      <RowIcon icon={FileIcon} className="mt-0" />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={open}
          disabled={busy}
          className="block max-w-full truncate text-left text-sm font-medium hover:underline"
        >
          {doc.file_name}
        </button>
        <p className="text-muted-foreground text-xs tabular-nums">
          {[
            doc.size != null ? formatBytes(doc.size, locale) : null,
            format(parseISO(doc.created_at), "d MMM yyyy", { locale: dateFnsLocale(locale) }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <ConfirmDialog
        title={t("confirmTitle")}
        description={t("confirmDescription", { name: doc.file_name })}
        onConfirm={remove}
        trigger={
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-destructive shrink-0"
            aria-label={t("deleteAria")}
          >
            <Trash2 />
          </Button>
        }
      />
    </li>
  );
}
