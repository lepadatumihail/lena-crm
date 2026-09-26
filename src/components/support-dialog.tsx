"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  FormDescription,
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
import { sendSupportMessage } from "@/lib/actions/support";
import { SUPPORT_EMAIL } from "@/lib/site";
import {
  SUPPORT_KINDS,
  supportFormSchema,
  type SupportFormValues,
} from "@/lib/validation/support";

/**
 * Bug reports, feedback and questions, sent to the support inbox without
 * leaving the app. The reply-to address starts as the signed-in one so we know
 * who wrote, and stays editable for agents who read a different mailbox.
 */
export function SupportDialog({
  open,
  onOpenChange,
  email,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The signed-in address, prefilled as the reply-to. */
  email: string;
}) {
  const t = useTranslations("support");
  const tCommon = useTranslations("common");
  const tv = useTranslations("validation");
  const pathname = usePathname();
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(() => supportFormSchema(tv), [tv]);
  const defaults: SupportFormValues = useMemo(
    () => ({ kind: "bug", replyTo: email, subject: "", message: "" }),
    [email]
  );
  const form = useForm<SupportFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  // Reopening starts clean — a half-typed bug report shouldn't follow the
  // agent to the next page.
  useEffect(() => {
    if (open) form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaults]);

  async function onSubmit(values: SupportFormValues) {
    setSubmitting(true);
    const { error } = await sendSupportMessage(values, { path: pathname });
    setSubmitting(false);
    if (error) {
      toast.error(t("failed"), {
        description: error,
        action: {
          label: t("mailto"),
          onClick: () => {
            window.location.href = mailtoHref(values);
          },
        },
      });
      return;
    }
    toast.success(t("sent"), {
      description: t("sentDescription", { email: values.replyTo }),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("kind.label")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPPORT_KINDS.map((kind) => (
                        <SelectItem key={kind} value={kind}>
                          {t(`kind.${kind}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="replyTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("replyTo.label")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder={t("replyTo.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("replyTo.hint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("subject.label")}{" "}
                    <span className="text-muted-foreground">
                      · {tCommon("optional")}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t("subject.placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("message.label")}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder={t("message.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:justify-between">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-muted-foreground hover:text-foreground self-center text-xs underline underline-offset-4 transition-colors"
              >
                {SUPPORT_EMAIL}
              </a>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {t("sending")}
                    </>
                  ) : (
                    t("send")
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/** Fallback when the send fails: hand the typed message to the agent's own mail client. */
function mailtoHref(values: SupportFormValues): string {
  const subject = values.subject?.trim() || values.kind;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(values.message)}`;
}
