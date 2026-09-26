"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";

import { languageName } from "@/components/marketing/language-name";
import { intlTag } from "@/i18n/config";
import { cn } from "@/lib/utils";

const CHANNEL_ICON = { whatsapp: MessageCircle, email: Mail } as const;

/**
 * A ready-to-send message in an article: the text as an agent would send it,
 * the language it is written in, the channel it belongs on, and a button that
 * copies it. The text is read straight out of the DOM, so what gets copied is
 * exactly what the reader sees.
 */
export function TemplateBlock({
  lang,
  channel = "whatsapp",
  title,
  hideLanguage = false,
  children,
  className,
}: {
  /** BCP 47 code of the message itself ("en", "es", "de"), not of the page. */
  lang: string;
  channel?: "whatsapp" | "email";
  title?: string;
  /**
   * Drop the language pill: inside a `<TemplateGroup>` the tab above the card
   * already names the language, so the pill would only repeat it. The `lang`
   * attribute on the text stays either way.
   */
  hideLanguage?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("marketing.template");
  const tag = intlTag(useLocale());
  const body = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ChannelIcon = CHANNEL_ICON[channel];

  async function copy() {
    const text = body.current?.textContent?.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // No clipboard permission (or no secure context): the text is on the
      // page and selectable, so there is nothing useful to say here.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={cn("bg-card mt-6 rounded-2xl border shadow-xs", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
          <ChannelIcon className="size-4 shrink-0" aria-hidden />
          {hideLanguage ? null : (
            <span className="bg-muted text-foreground rounded-full px-2 py-0.5 font-medium">
              {languageName(lang, tag)}
            </span>
          )}
          {title ? <span className="truncate">{title}</span> : null}
        </div>
        <button
          type="button"
          onClick={copy}
          className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors"
        >
          {copied ? (
            <Check className="text-foreground size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
      <div
        ref={body}
        lang={lang}
        className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
      >
        {children}
      </div>
    </div>
  );
}
