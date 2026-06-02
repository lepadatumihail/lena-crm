"use client";

import { useEffect, useRef, useState } from "react";
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
  const [createInit, setCreateInit] = useState<TemplateFormValues | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="text-muted-foreground text-sm">
            Reusable messages — personalise any of them with AI in the composer
            before sending.
          </p>
        </div>
        <Button onClick={() => setCreateInit({ name: "", subject: "", body: "" })}>
          <Plus /> New template
        </Button>
      </div>

      <section>
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          My templates
        </h2>
        {templates.length === 0 ? (
          <p className="text-muted-foreground mt-3 rounded-xl border border-dashed py-10 text-center text-sm">
            No templates yet. Create one, or customise a starter below.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} clients={clients} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Starter templates
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Built in and always available. Customise one to make it your own.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MESSAGE_TEMPLATES.map((t) => (
            <div key={t.id} className="bg-card flex flex-col rounded-lg border p-3">
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {t.description}
              </p>
              <div className="mt-3 flex gap-2">
                <UseTemplateButton
                  templateId={t.id}
                  clients={clients}
                  size="sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCreateInit({
                      name: t.label,
                      subject: t.subject,
                      body: t.body,
                    })
                  }
                >
                  <Copy /> Customise
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
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function onDelete() {
    const { error } = await deleteTemplate(template.id);
    if (error) {
      toast.error("Couldn't delete", { description: error });
      return false;
    }
    toast.success("Template deleted");
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
            aria-label="Edit template"
          >
            <Pencil className="size-4" />
          </Button>
          <ConfirmDialog
            title="Delete template?"
            description={`“${template.name}” will be removed.`}
            onConfirm={onDelete}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8"
                aria-label="Delete template"
              >
                <Trash2 className="size-4" />
              </Button>
            }
          />
        </div>
      </div>
      {template.subject && (
        <p className="text-muted-foreground mt-1 text-xs">
          Subject: {template.subject}
        </p>
      )}
      <p className="text-muted-foreground mt-2 line-clamp-3 flex-1 text-sm whitespace-pre-wrap">
        {template.body}
      </p>
      <div className="mt-3">
        <UseTemplateButton templateId={template.id} clients={clients} size="sm" />
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");

  function go() {
    if (!clientId) return;
    router.push(`/clients/${clientId}?compose=${templateId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size={size} onClick={() => setOpen(true)}>
        <Send /> Use
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Use this template</DialogTitle>
          <DialogDescription>
            Pick a client — the composer opens with this template loaded, ready
            to personalise and send.
          </DialogDescription>
        </DialogHeader>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a client…" />
          </SelectTrigger>
          <SelectContent>
            {clients.length === 0 ? (
              <div className="text-muted-foreground px-2 py-1.5 text-sm">
                No clients yet
              </div>
            ) : (
              clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={go} disabled={!clientId}>
            Open composer
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

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
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
      toast.error("Couldn't save template", { description: error });
      return;
    }
    toast.success(template ? "Template updated" : "Template created");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? "Edit template" : "New template"}</DialogTitle>
          <DialogDescription>
            Use placeholders like {"{{first_name}}"} — they fill from the
            client. Click a chip to insert one.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Price drop alert" {...field} />
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
                  <FormLabel>Subject (email only, optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Subject line" {...field} />
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
                  <FormLabel>Message</FormLabel>
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
                      placeholder="Hi {{first_name}}, …"
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
                Preview (sample data)
              </Label>
              <div className="bg-muted/40 rounded-lg border p-3 text-sm">
                {watchedSubject?.trim() && (
                  <p className="font-medium">
                    {fillTemplate(watchedSubject, SAMPLE_VARS)}
                  </p>
                )}
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {fillTemplate(watchedBody ?? "", SAMPLE_VARS) ||
                    "Your message preview will appear here."}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                {template ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
