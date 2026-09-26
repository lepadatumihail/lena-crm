"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const t = useTranslations("referrals");
  const common = useTranslations("common");
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(common("copied"), { description: text });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("link.copyFailed"), { description: text });
    }
  }
  return (
    <Button type="button" size="sm" onClick={copy}>
      {copied ? <Check /> : <Copy />}
      {label ?? t("link.copy")}
    </Button>
  );
}
