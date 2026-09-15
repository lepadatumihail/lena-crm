"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, ImageIcon, Loader2, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useUploadFiles,
  type UploadedFileMeta,
} from "@/components/file-upload";
import { createClient } from "@/lib/supabase/client";

type ActionResult = { error: string | null };

/** Which picker a file came through: the PDF one or the photo one. */
export type AttachKind = "pdf" | "image";

/**
 * A paperclip menu for one row's files, shared by buyer viewings and seller
 * properties: a PDF picker (a window card, a brochure) and a photo picker.
 * `onRecord` saves each uploaded file against the row.
 */
export function AttachMenu({
  agentId,
  clientId,
  folder,
  pdf,
  onRecord,
}: {
  agentId: string;
  clientId: string;
  /** Storage folder under the client, e.g. "viewings". */
  folder: string;
  /** The PDF item: its label, the noun for its toast, and whether several can be picked at once. */
  pdf: { label: string; successLabel: string; multiple?: boolean };
  onRecord: (meta: UploadedFileMeta, kind: AttachKind) => Promise<ActionResult>;
}) {
  const t = useTranslations("clientDetail.attachments");
  const pdfInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  async function record(meta: UploadedFileMeta, kind: AttachKind) {
    const { error } = await onRecord(meta, kind);
    if (error) {
      toast.error(t("saveError"), { description: error });
      return false;
    }
    return true;
  }

  const pdfs = useUploadFiles({
    agentId,
    clientId,
    folder,
    successLabel: pdf.successLabel,
    onUploaded: (meta) => record(meta, "pdf"),
  });
  const images = useUploadFiles({
    agentId,
    clientId,
    folder,
    successLabel: t("imageLabel"),
    onUploaded: (meta) => record(meta, "image"),
  });
  const busy = pdfs.uploading || images.uploading;

  return (
    <>
      <input
        ref={pdfInput}
        type="file"
        accept="application/pdf"
        multiple={pdf.multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void pdfs.handleFiles(e.target.files);
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
          <DropdownMenuItem onSelect={() => pdfInput.current?.click()}>
            <FileText />
            {pdf.label}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => imageInput.current?.click()}>
            <ImageIcon />
            {t("photos")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

/** One attached file: the name opens it in a new tab, the cross removes it. */
export function AttachmentChip({
  file,
  kind,
  removeDescription,
  onRemove,
}: {
  file: { file_name: string; storage_path: string };
  kind: AttachKind;
  /** The confirm dialog's sentence, e.g. "“card.pdf” will be removed from this viewing." */
  removeDescription: string;
  onRemove: () => Promise<ActionResult>;
}) {
  const t = useTranslations("clientDetail.attachments");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(file.storage_path, 60);
    setBusy(false);
    if (error || !data) {
      toast.error(t("openError"));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function remove() {
    const { error } = await onRemove();
    if (error) {
      toast.error(t("removeError"), { description: error });
      return false;
    }
    toast.success(t("removed"));
    router.refresh();
    return true;
  }

  return (
    <span className="bg-muted inline-flex h-7 max-w-64 items-center gap-1.5 rounded-md pr-1 pl-2 text-xs">
      {kind === "pdf" ? (
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
        {file.file_name}
      </button>
      <ConfirmDialog
        title={t("removeTitle")}
        description={removeDescription}
        confirmLabel={tCommon("remove")}
        onConfirm={remove}
        trigger={
          <button
            type="button"
            className="text-muted-foreground hover:bg-background hover:text-destructive flex size-5 shrink-0 items-center justify-center rounded transition-colors duration-150"
            aria-label={t("removeAria")}
          >
            <X className="size-3" />
          </button>
        }
      />
    </span>
  );
}
