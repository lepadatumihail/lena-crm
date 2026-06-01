"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const STORAGE_BUCKET = "attachments";
const MAX_FILE_BYTES = 15 * 1024 * 1024; // keep in sync with the bucket's file_size_limit

export type UploadedFileMeta = {
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size: number | null;
};

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function useFileUpload({
  agentId,
  clientId,
  folder,
}: {
  agentId: string;
  clientId: string;
  folder: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File): Promise<UploadedFileMeta | null> {
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File too large", {
        description: `${file.name} is ${(file.size / (1024 * 1024)).toFixed(
          1
        )} MB. The limit is 15 MB.`,
      });
      return null;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${agentId}/${clientId}/${folder}/${crypto.randomUUID()}-${sanitize(
        file.name
      )}`;
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          upsert: false,
          contentType: file.type || undefined,
        });
      if (error) {
        toast.error("Upload failed", { description: error.message });
        return null;
      }
      return {
        storage_path: path,
        file_name: file.name,
        mime_type: file.type || null,
        size: file.size,
      };
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading };
}

export function UploadButton({
  agentId,
  clientId,
  folder,
  accept,
  multiple = true,
  variant = "outline",
  size = "sm",
  successLabel = "File",
  children,
  onUploaded,
}: {
  agentId: string;
  clientId: string;
  folder: string;
  accept?: string;
  multiple?: boolean;
  variant?: "outline" | "secondary" | "default" | "ghost";
  size?: "sm" | "default";
  /** Singular noun for the success toast, e.g. "Window card", "Image". */
  successLabel?: string;
  children: React.ReactNode;
  /** Persist the uploaded file. Return `false` to mark it failed (no success toast). */
  onUploaded: (
    meta: UploadedFileMeta,
    file: File
  ) => Promise<boolean | void> | boolean | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { upload, uploading } = useFileUpload({ agentId, clientId, folder });

  async function handleFiles(files: FileList) {
    let saved = 0;
    for (const file of Array.from(files)) {
      const meta = await upload(file);
      if (meta) {
        const result = await onUploaded(meta, file);
        if (result !== false) saved += 1;
      }
    }
    if (saved > 0) {
      toast.success(
        saved === 1 ? `${successLabel} uploaded` : `${saved} files uploaded`
      );
      router.refresh();
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
        {children}
      </Button>
    </>
  );
}
