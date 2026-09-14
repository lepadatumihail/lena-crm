"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Mail, MessageCircle, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const BLANK = "blank";
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
    phone: string | null;
    email: string | null;
    language: string | null;
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
  }

  const canSend =
    body.trim().length > 0 &&
    (channel === "whatsapp" ? hasWhatsApp : hasEmail);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        <Sparkles /> {t("trigger")}
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title", { name: client.first_name })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!hasWhatsApp}
              onClick={() => setChannel("whatsapp")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40",
                channel === "whatsapp"
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent"
              )}
            >
              <MessageCircle className="size-4" /> WhatsApp
            </button>
            <button
              type="button"
              disabled={!hasEmail}
              onClick={() => setChannel("email")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40",
                channel === "email"
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent"
              )}
            >
              <Mail className="size-4" /> {t("email")}
            </button>
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

          <div className="space-y-1.5">
            <Label>{t("template")}</Label>
            <Select
              value={templateId || BLANK}
              onValueChange={(v) => selectTemplate(v === BLANK ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BLANK}>{t("blank")}</SelectItem>
                <SelectGroup>
                  <SelectLabel>{t("starters")}</SelectLabel>
                  {MESSAGE_TEMPLATES.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {templateLabel(tTemplates, tpl.id)} —{" "}
                      {templateDescription(tTemplates, tpl.id)}
                    </SelectItem>
                  ))}
                </SelectGroup>
                {customTemplates.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>{t("myTemplates")}</SelectLabel>
                    {customTemplates.map((tpl) => (
                      <SelectItem key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("language")}</Label>
            <Select value={language} onValueChange={changeLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {languageLabel(tCrm, l)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {channel === "email" && (
            <div className="space-y-1.5">
              <Label htmlFor="msg-subject">{t("subject")}</Label>
              <Input
                id="msg-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("subjectPlaceholder")}
              />
            </div>
          )}

          <div className="space-y-1.5">
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
              />
              <Button
                type="button"
                onClick={writeWithAI}
                disabled={aiLoading}
                className="shrink-0"
              >
                {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {body.trim() ? t("rewrite") : t("write")}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg-body">{t("message")}</Label>
            <Textarea
              id="msg-body"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("messagePlaceholder")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={send} disabled={!canSend}>
            <Send />
            {channel === "whatsapp" ? t("openWhatsApp") : t("openEmail")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
