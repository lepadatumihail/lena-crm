"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, Loader2, Pencil, Plus, Send, Trash2 } from "lucide-react";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteTemplate, saveTemplate } from "@/lib/actions/templates";
import {
  templateFormSchema,
  TEMPLATE_VARIABLES,
  type TemplateFormValues,
} from "@/lib/validation/template";
import {
  fillTemplate,
  MESSAGE_TEMPLATES,
  templateCopy,
  templateDescription,
  templateLabel,
  type MessageVars,
} from "@/lib/message-templates";
import type { EmailTemplate } from "@/lib/supabase/types";

type ClientOption = { id: string; name: string };

const SAMPLE_VARS: MessageVars = {
  first_name: "Maria",
  full_name: "Maria García",
  budget: "€500.000–€800.000",
  property: "the 3-bed in Nueva Andalucía",
  agency: "Costa Homes",
};

export function TemplatesView({
  templates,
  clients,
}: {
  templates: EmailTemplate[];
  clients: ClientOption[];
}) {
  const t = useTranslations("templates");
  const locale = useLocale();
  const [createInit, setCreateInit] = useState<TemplateFormValues | null>(null);
  // A starter customised from a Spanish UI starts from its Spanish copy.
  const starterLanguage = locale === "es" ? "Spanish" : "English";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => setCreateInit({ name: "", subject: "", body: "" })}
        >
          <Plus /> {t("new")}
        </Button>
      </div>

      <section>
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t("mine.title")}
        </h2>
        {templates.length === 0 ? (
          <p className="text-muted-foreground mt-3 rounded-xl border border-dashed py-10 text-center text-sm">
            {t("mine.empty")}
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {templates.map((tpl) => (
              <TemplateCard key={tpl.id} template={tpl} clients={clients} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t("starters.title")}
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          {t("starters.subtitle")}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MESSAGE_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-card flex flex-col rounded-lg border p-3"
            >
              <p className="text-sm font-medium">{templateLabel(t, tpl.id)}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {templateDescription(t, tpl.id)}
              </p>
              <div className="mt-3 flex gap-2">
                <UseTemplateButton
                  templateId={tpl.id}
                  clients={clients}
                  size="sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCreateInit({
                      name: templateLabel(t, tpl.id),
                      ...(templateCopy(tpl.id, starterLanguage) ?? {
                        subject: tpl.subject,
                        body: tpl.body,
                      }),
                    })
                  }
                >
                  <Copy /> {t("starters.customise")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <TemplateDialog
        open={createInit != null}
        onOpenChange={(o) => !o && setCreateInit(null)}
        initialValues={createInit ?? undefined}
      />
    </div>
  );
}

function TemplateCard({
  template,
  clients,
}: {
  template: EmailTemplate;
  clients: ClientOption[];
}) {
  const t = useTranslations("templates");
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function onDelete() {
    const { error } = await deleteTemplate(template.id);
    if (error) {
      toast.error(t("toasts.deleteFailed"), { description: error });
      return false;
    }
    toast.success(t("toasts.deleted"));
    router.refresh();
    return true;
  }

  return (
    <div className="bg-card flex flex-col rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate font-medium">{template.name}</p>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setEditing(true)}
            aria-label={t("card.editAria")}
          >
            <Pencil className="size-4" />
          </Button>
          <ConfirmDialog
            title={t("card.deleteTitle")}
            description={t("card.deleteDescription", { name: template.name })}
            onConfirm={onDelete}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8"
                aria-label={t("card.deleteAria")}
              >
                <Trash2 className="size-4" />
              </Button>
            }
          />
        </div>
      </div>
      {template.subject && (
        <p className="text-muted-foreground mt-1 text-xs">
          {t("card.subject", { subject: template.subject })}
        </p>
      )}
      <p className="text-muted-foreground mt-2 line-clamp-3 flex-1 text-sm whitespace-pre-wrap">
        {template.body}
      </p>
      <div className="mt-3">
        <UseTemplateButton
          templateId={template.id}
          clients={clients}
          size="sm"
        />
      </div>

      <TemplateDialog
        open={editing}
        onOpenChange={setEditing}
        template={template}
      />
    </div>
  );
}

function UseTemplateButton({
  templateId,
  clients,
  size = "default",
}: {
  templateId: string;
  clients: ClientOption[];
  size?: "default" | "sm";
}) {
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");

  function go() {
    if (!clientId) return;
    router.push(`/clients/${clientId}?compose=${templateId}`);
  }

  // Templates are buyer-facing, and the new-client form has no side switch,
  // so the shortcut always creates a buyer. `compose` rides along so the
  // composer opens with this template once the client is saved.
  const newClientHref = `/clients/new?side=buyer&compose=${templateId}`;
  const addLink = (chunks: React.ReactNode) => (
    <Link href={newClientHref} className="text-primary hover:underline">
      {chunks}
    </Link>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size={size} onClick={() => setOpen(true)}>
        <Send /> {t("use.button")}
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("use.title")}</DialogTitle>
          <DialogDescription>{t("use.description")}</DialogDescription>
        </DialogHeader>
        {clients.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-sm">
            {t.rich("use.noClients", { link: addLink })}
          </p>
        ) : (
          <div className="space-y-2">
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("use.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {t.rich("use.notInList", { link: addLink })}
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={go} disabled={!clientId}>
            {t("use.open")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateDialog({
  open,
  onOpenChange,
  template,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplate;
  initialValues?: TemplateFormValues;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const seed = (): TemplateFormValues => ({
    name: template?.name ?? initialValues?.name ?? "",
    subject: template?.subject ?? initialValues?.subject ?? "",
    body: template?.body ?? initialValues?.body ?? "",
  });

  const t = useTranslations("templates");
  const tCommon = useTranslations("common");
  const tv = useTranslations("validation");
  const schema = useMemo(() => templateFormSchema(tv), [tv]);
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: seed(),
  });

  useEffect(() => {
    if (open) form.reset(seed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template?.id, initialValues]);

  const watchedSubject = form.watch("subject");
  const watchedBody = form.watch("body");

  function insertVar(name: string) {
    const token = `{{${name}}}`;
    const el = bodyRef.current;
    const current = form.getValues("body") ?? "";
    if (!el) {
      form.setValue("body", current + token, { shouldDirty: true });
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    form.setValue("body", next, { shouldDirty: true });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function onSubmit(values: TemplateFormValues) {
    setSubmitting(true);
    const { error } = await saveTemplate(template?.id ?? null, values);
    setSubmitting(false);
    if (error) {
      toast.error(t("toasts.saveFailed"), { description: error });
      return;
    }
    toast.success(t(template ? "toasts.updated" : "toasts.created"));
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t(template ? "dialog.editTitle" : "dialog.newTitle")}
          </DialogTitle>
          <DialogDescription>{t("dialog.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dialog.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("dialog.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dialog.subject")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("dialog.subjectPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dialog.message")}</FormLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATE_VARIABLES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVar(v)}
                        className="bg-muted hover:bg-accent rounded border px-1.5 py-0.5 font-mono text-[11px] transition-colors"
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder={t("dialog.bodyPlaceholder")}
                      {...field}
                      ref={bodyRef}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">
                {t("dialog.preview")}
              </Label>
              <div className="bg-muted/40 rounded-lg border p-3 text-sm">
                {watchedSubject?.trim() && (
                  <p className="font-medium">
                    {fillTemplate(watchedSubject, SAMPLE_VARS)}
                  </p>
                )}
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {fillTemplate(watchedBody ?? "", SAMPLE_VARS) ||
                    t("dialog.previewEmpty")}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                {template ? tCommon("save") : t("dialog.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
