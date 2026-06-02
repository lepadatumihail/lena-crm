"use client";

import { useState } from "react";
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
  fillTemplate,
  getTemplate,
  MESSAGE_TEMPLATES,
  type MessageVars,
} from "@/lib/message-templates";
import { whatsappLink } from "@/lib/whatsapp";
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
  vars,
  customTemplates = [],
  propertyOptions = [],
  autoOpenTemplate,
}: {
  client: {
    id: string;
    first_name: string;
    phone: string | null;
    email: string | null;
    language: string | null;
  };
  vars: MessageVars;
  customTemplates?: ComposerTemplate[];
  propertyOptions?: string[];
  autoOpenTemplate?: string | null;
}) {
  const hasWhatsApp = whatsappLink(client.phone) != null;
  const hasEmail = Boolean(client.email);

  const initial = autoOpenTemplate
    ? getTemplate(autoOpenTemplate) ??
      customTemplates.find((t) => t.id === autoOpenTemplate) ??
      null
    : null;
  const defaultLanguage =
    client.language && (LANGUAGES as readonly string[]).includes(client.language)
      ? client.language
      : "English";
  const propertyChoices = Array.from(
    new Set([vars.property, ...propertyOptions].filter(Boolean))
  );

  const [open, setOpen] = useState(Boolean(initial));
  const [channel, setChannel] = useState<Channel>(
    hasWhatsApp ? "whatsapp" : "email"
  );
  const [templateId, setTemplateId] = useState(initial?.id ?? "");
  const [language, setLanguage] = useState(defaultLanguage);
  const [propertyLabel, setPropertyLabel] = useState(vars.property ?? "");
  const [instruction, setInstruction] = useState("");
  const [subject, setSubject] = useState(
    initial ? fillTemplate(initial.subject, vars) : ""
  );
  const [body, setBody] = useState(
    initial ? fillTemplate(initial.body, vars) : ""
  );
  const [aiLoading, setAiLoading] = useState(false);

  function findTemplate(
    id: string
  ): { subject: string; body: string } | null {
    const builtin = getTemplate(id);
    if (builtin) return { subject: builtin.subject, body: builtin.body };
    return customTemplates.find((t) => t.id === id) ?? null;
  }

  function selectTemplate(id: string) {
    setTemplateId(id);
    const t = findTemplate(id);
    if (t) {
      const filled = { ...vars, property: propertyLabel || vars.property };
      setSubject(fillTemplate(t.subject, filled));
      setBody(fillTemplate(t.body, filled));
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
      toast.error("Couldn't draft with AI", { description: res.error });
      return;
    }
    if (res.subject) setSubject(res.subject);
    setBody(res.body);
    toast.success("Draft ready — review before sending");
  }

  function send() {
    const text = body.trim();
    if (!text) return;
    if (channel === "whatsapp") {
      const url = whatsappLink(client.phone, text);
      if (!url) {
        toast.error("No usable phone number for this client");
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
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Sparkles /> Draft a message
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Message {client.first_name}</DialogTitle>
          <DialogDescription>
            Pick a starting point, personalise it with AI, then send from your
            own WhatsApp or email.
          </DialogDescription>
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
              <Mail className="size-4" /> Email
            </button>
          </div>

          {propertyChoices.length > 0 && (
            <div className="space-y-1.5">
              <Label>Property</Label>
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
                    No specific property
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
            <Label>Template</Label>
            <Select
              value={templateId || BLANK}
              onValueChange={(v) => selectTemplate(v === BLANK ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BLANK}>Blank / write your own</SelectItem>
                <SelectGroup>
                  <SelectLabel>Starters</SelectLabel>
                  {MESSAGE_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label} — {t.description}
                    </SelectItem>
                  ))}
                </SelectGroup>
                {customTemplates.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>My templates</SelectLabel>
                    {customTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {channel === "email" && (
            <div className="space-y-1.5">
              <Label htmlFor="msg-subject">Subject</Label>
              <Input
                id="msg-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="msg-ai">
              Personalise with AI{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
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
                placeholder="e.g. shorter and more formal, mention the sea view"
              />
              <Button
                type="button"
                onClick={writeWithAI}
                disabled={aiLoading}
                className="shrink-0"
              >
                {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {body.trim() ? "Rewrite" : "Write"}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg-body">Message</Label>
            <Textarea
              id="msg-body"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message, or let AI draft it…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={send} disabled={!canSend}>
            <Send />
            {channel === "whatsapp" ? "Open in WhatsApp" : "Open in email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
