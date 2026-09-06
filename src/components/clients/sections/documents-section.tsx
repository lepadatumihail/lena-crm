"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { File as FileIcon, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UploadButton } from "@/components/file-upload";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { addDocument, deleteDocument } from "@/lib/actions/documents";
import { createClient } from "@/lib/supabase/client";
import type { DocumentRow } from "@/lib/supabase/types";

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <UploadButton
          agentId={agentId}
          clientId={clientId}
          folder="documents"
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
      </CardHeader>
      <CardContent className="space-y-1.5">
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          documents.map((d) => (
            <DocumentRowItem key={d.id} clientId={clientId} doc={d} />
          ))
        )}
      </CardContent>
    </Card>
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
    <div className="bg-muted/40 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
      <FileIcon className="text-muted-foreground size-4 shrink-0" />
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="min-w-0 flex-1 truncate text-left hover:underline"
      >
        {doc.file_name}
      </button>
      {doc.size != null && (
        <span className="text-muted-foreground shrink-0 text-xs">
          {formatBytes(doc.size)}
        </span>
      )}
      <ConfirmDialog
        title={t("confirmTitle")}
        description={t("confirmDescription", { name: doc.file_name })}
        onConfirm={remove}
        trigger={
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive shrink-0"
            aria-label={t("deleteAria")}
          >
            <Trash2 className="size-3.5" />
          </button>
        }
      />
    </div>
  );
}
