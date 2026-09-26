"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Copy,
  FileText,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

import { RowIcon } from "@/components/shell/key-value";
import { Panel, PanelEmpty } from "@/components/shell/panel";
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

/**
 * Message templates on two panels: the agent's own, and the built-in
 * starters, which can be sent as they are or copied and made their own.
 */
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-2xl text-sm text-pretty">
          {t("subtitle")}
        </p>
        <Button
          size="sm"
          onClick={() => setCreateInit({ name: "", subject: "", body: "" })}
        >
          <Plus /> {t("new")}
        </Button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Panel
          title={t("mine.title")}
          icon={<FileText className="size-3.5" />}
          count={templates.length}
        >
          {templates.length === 0 ? (
            <PanelEmpty>{t("mine.empty")}</PanelEmpty>
          ) : (
            <ul className="divide-y">
              {templates.map((tpl) => (
                <TemplateRow key={tpl.id} template={tpl} clients={clients} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title={t("starters.title")}
          icon={<Sparkles className="size-3.5" />}
          count={MESSAGE_TEMPLATES.length}
          footer={t("starters.subtitle")}
        >
          <ul className="divide-y">
            {MESSAGE_TEMPLATES.map((tpl) => (
              <li key={tpl.id} className="flex items-center gap-3 px-4 py-3">
                {/* The same icon on every row: on a phone the name needs the room more. */}
                <RowIcon icon={Sparkles} className="mt-0 max-sm:hidden" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {templateLabel(t, tpl.id)}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {templateDescription(t, tpl.id)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <UseTemplateButton templateId={tpl.id} clients={clients} />
                  <Button
                    variant="ghost"
                    size="xs"
                    aria-label={t("starters.customise")}
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
                    <Copy />
                    <span className="hidden sm:inline">{t("starters.customise")}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <TemplateDialog
        open={createInit != null}
        onOpenChange={(o) => !o && setCreateInit(null)}
        initialValues={createInit ?? undefined}
      />
    </div>
  );
}

/** One of the agent's templates: its name, the subject or the opening line, and its actions. */
function TemplateRow({
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

  const preview = template.subject?.trim()
    ? t("card.subject", { subject: template.subject })
    : template.body;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <RowIcon icon={MessageSquareText} className="mt-0 max-sm:hidden" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{template.name}</p>
        <p className="text-muted-foreground truncate text-xs">{preview}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <UseTemplateButton templateId={template.id} clients={clients} />
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setEditing(true)}
          aria-label={t("card.editAria")}
          title={t("card.editAria")}
        >
          <Pencil />
        </Button>
        <ConfirmDialog
          title={t("card.deleteTitle")}
          description={t("card.deleteDescription", { name: template.name })}
          onConfirm={onDelete}
          trigger={
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-destructive"
              aria-label={t("card.deleteAria")}
              title={t("card.deleteAria")}
            >
              <Trash2 />
            </Button>
          }
        />
      </div>

      <TemplateDialog open={editing} onOpenChange={setEditing} template={template} />
    </li>
  );
}

function UseTemplateButton({
  templateId,
  clients,
  size = "xs",
}: {
  templateId: string;
  clients: ClientOption[];
  size?: ComponentProps<typeof Button>["size"];
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
    <Link
      href={newClientHref}
      className="text-foreground decoration-foreground/25 hover:decoration-foreground font-medium underline underline-offset-4"
    >
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
          {/* With no clients the link above is the way forward, not a dead button. */}
          <Button variant="outline" onClick={() => setOpen(false)}>
            {clients.length === 0 ? tCommon("close") : tCommon("cancel")}
          </Button>
          {clients.length > 0 ? (
            <Button onClick={go} disabled={!clientId}>
              {t("use.open")}
            </Button>
          ) : null}
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
                        className="bg-background hover:bg-muted text-foreground/80 hover:text-foreground focus-visible:ring-ring/50 rounded-md border px-1.5 py-0.5 font-mono text-[11px] outline-none transition-colors focus-visible:ring-[3px]"
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
                variant="outline"
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
