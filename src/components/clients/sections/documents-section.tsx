"use client";

import { useState } from "react";
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
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Documents</CardTitle>
        <UploadButton
          agentId={agentId}
          clientId={clientId}
          folder="documents"
          successLabel="Document"
          onUploaded={async (meta) => {
            const { error } = await addDocument(clientId, meta);
            if (error) {
              toast.error("Couldn't save document", { description: error });
              return false;
            }
            return true;
          }}
        >
          Upload
        </UploadButton>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Upload contracts, IDs, or anything else for this client.
          </p>
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
      toast.error("Couldn't open file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function remove() {
    const { error } = await deleteDocument(clientId, doc.id);
    if (error) {
      toast.error("Couldn't delete", { description: error });
      return false;
    }
    toast.success("Document deleted");
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
        title="Delete document?"
        description={`“${doc.file_name}” will be permanently deleted.`}
        onConfirm={remove}
        trigger={
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive shrink-0"
            aria-label="Delete document"
          >
            <Trash2 className="size-3.5" />
          </button>
        }
      />
    </div>
  );
}
