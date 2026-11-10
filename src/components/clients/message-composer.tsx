"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Languages, Loader2, Mail, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SteadyLabel } from "@/components/ui/steady-label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { useContactLog } from "@/components/clients/contact-log";
import { WhatsAppIcon } from "@/components/clients/whatsapp-button";
import { draftMessage } from "@/lib/actions/messages";
import {
  MESSAGE_TEMPLATES,
  type TemplateVarsInput,
  buildVars,
  fillTemplate,
  getTemplate,
  templateCopy,
  templateDescription,
  templateLabel,
} from "@/lib/message-templates";
import { whatsappLink } from "@/lib/whatsapp";
import { languageLabel } from "@/i18n/labels";
import { LANGUAGES } from "@/lib/crm";
import { cn } from "@/lib/utils";
import { ACTIVITY_BODY_MAX } from "@/lib/validation/activity";

const NO_PROPERTY = "none";

type Channel = "whatsapp" | "email";

export type ComposerTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export function MessageComposer({
  client,
  varsInput,
  customTemplates = [],
  propertyOptions = [],
  autoOpenTemplate,
  triggerVariant = "outline",
  triggerSize = "default",
  triggerClassName,
}: {
  client: {
    id: string;
    first_name: string;
    /** For the avatar's initials in the header. */
    last_name?: string | null;
    phone: string | null;
    email: string | null;
    language: string | null;
    side: string;
    stage: string;
  };
  varsInput: TemplateVarsInput;
  customTemplates?: ComposerTemplate[];
  propertyOptions?: string[];
  autoOpenTemplate?: string | null;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  triggerSize?: "default" | "sm" | "xs";
  triggerClassName?: string;
}) {
  const t = useTranslations("clientDetail.composer");
  const tCrm = useTranslations("crm");
  const tCommon = useTranslations("common");
  const tTemplates = useTranslations("templates");
  const hasWhatsApp = whatsappLink(client.phone) != null;
  const hasEmail = Boolean(client.email);
  // Sending logs the contact and asks for the next step.
  const contactLog = useContactLog({
    id: client.id,
    firstName: client.first_name,
    name: [client.first_name, client.last_name].filter(Boolean).join(" "),
    side: client.side,
    stage: client.stage,
  });

  const defaultLanguage =
    client.language && (LANGUAGES as readonly string[]).includes(client.language)
      ? client.language
      : "English";
  // Starters and the {{budget}} fill follow the client's language, so both
  // are resolved here against the language the agent is composing in.
  const initial = autoOpenTemplate
    ? getTemplate(autoOpenTemplate, defaultLanguage) ??
      customTemplates.find((tpl) => tpl.id === autoOpenTemplate) ??
      null
    : null;
  const [language, setLanguage] = useState(defaultLanguage);
  const vars = useMemo(() => buildVars(varsInput, language), [varsInput, language]);
  const propertyChoices = Array.from(
    new Set([vars.property, ...propertyOptions].filter(Boolean))
  );

  const [open, setOpen] = useState(Boolean(initial));
  const [channel, setChannel] = useState<Channel>(
    hasWhatsApp ? "whatsapp" : "email"
  );
  const [templateId, setTemplateId] = useState(initial?.id ?? "");
  const [propertyLabel, setPropertyLabel] = useState(vars.property ?? "");
  const [instruction, setInstruction] = useState("");
  const [subject, setSubject] = useState(() =>
    initial ? fillTemplate(initial.subject, vars) : ""
  );
  const [body, setBody] = useState(() =>
    initial ? fillTemplate(initial.body, vars) : ""
  );
  // What the last applied template produced, to tell an untouched draft from
  // one the agent has edited before swapping language.
  const [lastFill, setLastFill] = useState<{ subject: string; body: string } | null>(
    () =>
      initial
        ? { subject: fillTemplate(initial.subject, vars), body: fillTemplate(initial.body, vars) }
        : null
  );
  const [aiLoading, setAiLoading] = useState(false);

  function findTemplate(
    id: string,
    lang: string
  ): { subject: string; body: string } | null {
    return templateCopy(id, lang) ?? customTemplates.find((tpl) => tpl.id === id) ?? null;
  }

  function applyTemplate(id: string, lang: string) {
    const tpl = findTemplate(id, lang);
    if (!tpl) return;
    const langVars = buildVars(varsInput, lang);
    const filled = { ...langVars, property: propertyLabel || langVars.property };
    const next = {
      subject: fillTemplate(tpl.subject, filled),
      body: fillTemplate(tpl.body, filled),
    };
    setSubject(next.subject);
    setBody(next.body);
    setLastFill(next);
  }

  function selectTemplate(id: string) {
    setTemplateId(id);
    applyTemplate(id, language);
  }

  /** Re-apply a built-in starter in the new language unless the agent has edited it. */
  function changeLanguage(next: string) {
    setLanguage(next);
    const untouched =
      lastFill != null && body === lastFill.body && subject === lastFill.subject;
    if (templateId && untouched && templateCopy(templateId, next)) {
      applyTemplate(templateId, next);
    }
  }

  async function writeWithAI() {
    setAiLoading(true);
    const res = await draftMessage({
      clientId: client.id,
      channel,
      language,
      draft: body.trim() || undefined,
      instruction: instruction.trim() || undefined,
      property: propertyLabel.trim() || undefined,
    });
    setAiLoading(false);
    if (res.error) {
      toast.error(t("aiError"), { description: res.error });
      return;
    }
    if (res.subject) setSubject(res.subject);
    setBody(res.body);
    toast.success(t("aiReady"));
  }

  function send() {
    const text = body.trim();
    if (!text) return;
    if (channel === "whatsapp") {
      const url = whatsappLink(client.phone, text);
      if (!url) {
        toast.error(t("noPhone"));
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      const url = `mailto:${client.email ?? ""}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(text)}`;
      window.location.href = url;
    }
    setOpen(false);
    void contactLog.logStarted(channel, text.slice(0, ACTIVITY_BODY_MAX));
  }

  const canSend =
    body.trim().length > 0 &&
    (channel === "whatsapp" ? hasWhatsApp : hasEmail);

  const fullName = [client.first_name, client.last_name].filter(Boolean).join(" ");
  const address = channel === "whatsapp" ? client.phone : client.email;
  // Every starting point as a chip, one tap each: the built-in starters,
  // then the agent's own. Hovering one says what it is for.
  const templateChoices = [
    ...MESSAGE_TEMPLATES.map((tpl) => ({
      id: tpl.id,
      label: templateLabel(tTemplates, tpl.id),
      hint: templateDescription(tTemplates, tpl.id),
    })),
    ...customTemplates.map((tpl) => ({ id: tpl.id, label: tpl.name, hint: tpl.subject })),
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
          onClick={() => setOpen(true)}
        >
          {/* Its own span, so a squeezed trigger cuts the label, not the icon. */}
          <Sparkles /> <span className="truncate">{t("trigger")}</span>
        </Button>
        <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto sm:max-w-xl">
          {/* Who it goes to, and where: the number or the address it opens with. */}
          <DialogHeader className="flex-row items-center gap-3 pr-8">
            <ClientAvatar name={fullName} side={client.side} size="lg" />
            <div className="min-w-0">
              <DialogTitle className="font-display text-xl leading-tight font-normal tracking-[-0.02em]">
                {t("title", { name: client.first_name })}
              </DialogTitle>
              <p className="text-muted-foreground mt-1 flex min-w-0 items-center gap-1.5 text-[13px]">
                {channel === "whatsapp" ? (
                  <WhatsAppIcon className="size-3.5 shrink-0" />
                ) : (
                  <Mail className="size-3.5 shrink-0" />
                )}
                <span className="truncate">{address ?? "—"}</span>
              </p>
              <DialogDescription className="sr-only">{t("description")}</DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <div
              role="group"
              aria-label={t("channel")}
              className="bg-muted grid grid-cols-2 gap-1 rounded-full p-1"
            >
              <ChannelButton
                active={channel === "whatsapp"}
                disabled={!hasWhatsApp}
                onClick={() => setChannel("whatsapp")}
              >
                <WhatsAppIcon className="size-4" />
                <SteadyLabel>WhatsApp</SteadyLabel>
              </ChannelButton>
              <ChannelButton
                active={channel === "email"}
                disabled={!hasEmail}
                onClick={() => setChannel("email")}
              >
                <Mail className="size-4" />
                <SteadyLabel>{t("email")}</SteadyLabel>
              </ChannelButton>
            </div>

            {propertyChoices.length > 0 && (
              <div className="space-y-1.5">
                <Label>{t("property")}</Label>
                <Select
                  value={propertyLabel || NO_PROPERTY}
                  onValueChange={(v) =>
                    setPropertyLabel(v === NO_PROPERTY ? "" : v)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PROPERTY}>
                      {t("noProperty")}
                    </SelectItem>
                    {propertyChoices.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span id="msg-template-label" className="text-sm leading-none font-medium">
                  {t("template")}
                </span>
                <Select value={language} onValueChange={changeLanguage}>
                  <SelectTrigger
                    size="sm"
                    aria-label={t("language")}
                    className="bg-muted/80 hover:bg-muted rounded-full border-0 px-3 text-[13px] shadow-none dark:bg-muted/80"
                  >
                    <Languages className="size-3.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {languageLabel(tCrm, l)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div
                role="group"
                aria-labelledby="msg-template-label"
                className="flex flex-wrap gap-1.5"
              >
                {templateChoices.map((tpl) => (
                  <TemplateChip
                    key={tpl.id}
                    selected={templateId === tpl.id}
                    title={tpl.hint || undefined}
                    onClick={() => selectTemplate(tpl.id)}
                  >
                    {tpl.label}
                  </TemplateChip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="msg-body">{t("message")}</Label>
              {channel === "whatsapp" ? (
                // A preview of the chat: the message sits in WhatsApp's own
                // outgoing bubble, so the agent reads it as the client will.
                <div className="bg-muted/60 rounded-2xl p-3 dark:bg-muted/30">
                  <div className="ml-auto max-w-[94%] rounded-2xl rounded-br-md bg-[#d9fdd3] shadow-xs ring-1 ring-black/[0.04] transition-shadow duration-150 focus-within:ring-2 focus-within:ring-[#25D366]/60 dark:bg-[#005c4b] dark:ring-white/[0.06]">
                    <Textarea
                      id="msg-body"
                      rows={2}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={t("messagePlaceholder")}
                      className="max-h-72 min-h-16 resize-none border-0 bg-transparent px-3.5 py-2.5 text-[15px] leading-relaxed text-[#111b21] shadow-none focus-visible:ring-0 md:text-[15px] dark:bg-transparent dark:text-[#e9edef]"
                    />
                  </div>
                </div>
              ) : (
                // An email: the subject line on top of the body, one sheet.
                <div className="bg-background focus-within:ring-ring/50 overflow-hidden rounded-xl border shadow-xs transition-shadow duration-150 focus-within:ring-[3px] dark:bg-input/30">
                  <Input
                    id="msg-subject"
                    aria-label={t("subject")}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t("subjectPlaceholder")}
                    className="h-11 rounded-none border-0 border-b px-3.5 font-medium shadow-none focus-visible:ring-0 dark:bg-transparent"
                  />
                  <Textarea
                    id="msg-body"
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={t("messagePlaceholder")}
                    className="min-h-36 resize-none rounded-none border-0 bg-transparent px-3.5 py-3 leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="msg-ai">
                {t.rich("aiLabel", {
                  muted: (chunks) => (
                    <span className="text-muted-foreground font-normal">
                      {chunks}
                    </span>
                  ),
                })}
              </Label>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Sparkles
                    aria-hidden
                    className="text-tone-indigo-ink pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  />
                  <Input
                    id="msg-ai"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        writeWithAI();
                      }
                    }}
                    placeholder={t("aiPlaceholder")}
                    className="pl-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={writeWithAI}
                  disabled={aiLoading}
                  className="shrink-0"
                >
                  {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {body.trim() ? t("rewrite") : t("write")}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={send} disabled={!canSend}>
              {channel === "whatsapp" ? <WhatsAppIcon className="text-current" /> : <Send />}
              {channel === "whatsapp" ? t("openWhatsApp") : t("openEmail")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {contactLog.dialog}
    </>
  );
}

/** One half of the WhatsApp / Email switch: the chosen side is a raised white pill. */
function ChannelButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-ring/50 flex h-9 items-center justify-center gap-2 rounded-full px-3 text-sm outline-none select-none transition-[color,background-color,box-shadow] duration-150 focus-visible:ring-[3px] disabled:opacity-40 [touch-action:manipulation]",
        active
          ? "bg-background text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.1)] dark:bg-input/60"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

/**
 * A starting point as a soft pill, the chosen one in the brand's indigo with
 * a hairline ring, as on the agent page's form. The weight never changes,
 * so picking one doesn't reflow the row.
 */
function TemplateChip({
  selected,
  title,
  onClick,
  children,
}: {
  selected: boolean;
  title?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      title={title}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-ring/50 inline-flex h-8 items-center rounded-full px-3 text-[13px] outline-none select-none transition-[color,background-color,box-shadow,scale] duration-150 ease-(--ease-out-quint) focus-visible:ring-[3px] active:scale-[0.96] [touch-action:manipulation]",
        selected
          ? "bg-tone-indigo-soft text-tone-indigo-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
          : "bg-muted/80 text-foreground/80 hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
