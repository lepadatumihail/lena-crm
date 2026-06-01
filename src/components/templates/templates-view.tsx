"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteTemplate, saveTemplate } from "@/lib/actions/templates";
import {
  templateFormSchema,
  TEMPLATE_VARIABLES,
  type TemplateFormValues,
} from "@/lib/validation/template";
import { MESSAGE_TEMPLATES } from "@/lib/message-templates";
import type { EmailTemplate } from "@/lib/supabase/types";

export function TemplatesView({ templates }: { templates: EmailTemplate[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="text-muted-foreground text-sm">
            Reusable messages for the composer — personalise any of them with AI
            before sending.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus /> New template
        </Button>
      </div>

      <div className="bg-muted/40 text-muted-foreground rounded-lg border p-3 text-sm">
        <span className="mr-1">Drop these into your text — they fill from the client:</span>
        {TEMPLATE_VARIABLES.map((v) => (
          <code
            key={v}
            className="bg-background mr-1 inline-block rounded border px-1.5 py-0.5 text-xs"
          >
            {`{{${v}}}`}
          </code>
        ))}
      </div>

      <section>
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          My templates
        </h2>
        {templates.length === 0 ? (
          <p className="text-muted-foreground mt-3 rounded-xl border border-dashed py-10 text-center text-sm">
            No templates yet. Create one to reuse it in the composer.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Starter templates
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Built in and always available in the composer.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MESSAGE_TEMPLATES.map((t) => (
            <div key={t.id} className="rounded-lg border p-3">
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {t.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <TemplateDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}

function TemplateCard({ template }: { template: EmailTemplate }) {
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
    <div className="bg-card rounded-lg border p-4">
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
      <p className="text-muted-foreground mt-2 line-clamp-3 text-sm whitespace-pre-wrap">
        {template.body}
      </p>

      <TemplateDialog
        open={editing}
        onOpenChange={setEditing}
        template={template}
      />
    </div>
  );
}

function TemplateDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplate;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name ?? "",
      subject: template?.subject ?? "",
      body: template?.body ?? "",
    },
  });

  useEffect(() => {
    if (open)
      form.reset({
        name: template?.name ?? "",
        subject: template?.subject ?? "",
        body: template?.body ?? "",
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template?.id]);

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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit template" : "New template"}</DialogTitle>
          <DialogDescription>
            Use placeholders like {"{{first_name}}"} and {"{{property}}"} — they
            fill from the client automatically.
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
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Hi {{first_name}}, …"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
