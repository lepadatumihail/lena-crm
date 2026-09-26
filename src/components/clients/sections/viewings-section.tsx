"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CalendarClock,
  Euro,
  Eye,
  Home,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { RowIcon } from "@/components/shell/key-value";
import { Panel, PanelEmpty } from "@/components/shell/panel";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { AttachMenu, AttachmentChip } from "@/components/clients/attachments";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ViewingDialog } from "@/components/clients/viewing-dialog";
import {
  addViewingAttachment,
  deleteViewing,
  deleteViewingAttachment,
} from "@/lib/actions/buyer";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import { formatCurrency } from "@/lib/crm";
import type { ViewingWithAttachments } from "@/lib/data/buyer";

export function ViewingsSection({
  clientId,
  agentId,
  viewings,
}: {
  clientId: string;
  agentId: string;
  viewings: ViewingWithAttachments[];
}) {
  const t = useTranslations("clientDetail.viewings");
  const [adding, setAdding] = useState(false);

  return (
    <Panel
      title={t("title")}
      icon={<Eye className="size-3.5" />}
      count={viewings.length}
      action={
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground -mr-1.5"
          onClick={() => setAdding(true)}
        >
          <Plus /> {t("add")}
        </Button>
      }
    >
      {viewings.length === 0 ? (
        <PanelEmpty>{t("empty")}</PanelEmpty>
      ) : (
        <ul className="divide-y">
          {viewings.map((v) => (
            <ViewingCard
              key={v.id}
              clientId={clientId}
              agentId={agentId}
              viewing={v}
            />
          ))}
        </ul>
      )}

      <ViewingDialog
        clientId={clientId}
        open={adding}
        onOpenChange={setAdding}
      />
    </Panel>
  );
}

function ViewingCard({
  clientId,
  agentId,
  viewing,
}: {
  clientId: string;
  agentId: string;
  viewing: ViewingWithAttachments;
}) {
  const t = useTranslations("clientDetail.viewings");
  const locale = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function onDelete() {
    const { error } = await deleteViewing(clientId, viewing.id);
    if (error) {
      toast.error(t("deleteError"), { description: error });
      return false;
    }
    toast.success(t("deleted"));
    router.refresh();
    return true;
  }

  const hasMeta = viewing.scheduled_at || viewing.property_price != null;

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <RowIcon icon={Home} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm leading-6 font-medium">
              {viewing.title || t("untitled")}
            </p>
            {viewing.had_offer ? (
              <Tag tone="green" className="tabular-nums">
                {t("offer", {
                  price: formatCurrency(viewing.offer_price, intlTag(locale)),
                })}
              </Tag>
            ) : null}
          </div>
          {viewing.description ? (
            <p className="text-muted-foreground text-[13px]">{viewing.description}</p>
          ) : null}
          {hasMeta ? (
            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {viewing.scheduled_at ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" strokeWidth={1.75} />
                  {format(new Date(viewing.scheduled_at), "EEE d MMM, HH:mm", {
                    locale: dateFnsLocale(locale),
                  })}
                </span>
              ) : null}
              {viewing.property_price != null ? (
                <span className="inline-flex items-center gap-1.5">
                  <Euro className="size-3.5" strokeWidth={1.75} />
                  {t.rich("asking", {
                    amount: formatCurrency(viewing.property_price, intlTag(locale)),
                    price: (chunks) => (
                      <span className="text-foreground tabular-nums">
                        {chunks}
                      </span>
                    ),
                  })}
                </span>
              ) : null}
            </p>
          ) : null}
          {viewing.attachments.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {viewing.attachments.map((a) => (
                <AttachmentChip
                  key={a.id}
                  file={a}
                  kind={a.kind === "window_card" ? "pdf" : "image"}
                  removeDescription={t("removeAttachmentDescription", {
                    name: a.file_name,
                  })}
                  onRemove={() => deleteViewingAttachment(clientId, a.id)}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <AttachMenu
            agentId={agentId}
            clientId={clientId}
            folder="viewings"
            pdf={{ label: t("attachWindowCard"), successLabel: t("windowCard") }}
            onRecord={(meta, kind) =>
              addViewingAttachment(clientId, viewing.id, {
                ...meta,
                kind: kind === "pdf" ? "window_card" : "image",
              })
            }
          />
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setEditing(true)}
            aria-label={t("editAria")}
          >
            <Pencil />
          </Button>
          <ConfirmDialog
            title={t("confirmTitle")}
            description={t("confirmDescription", {
              title: viewing.title || t("untitled"),
            })}
            onConfirm={onDelete}
            trigger={
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                aria-label={t("deleteAria")}
              >
                <Trash2 />
              </Button>
            }
          />
        </div>
      </div>

      <ViewingDialog
        clientId={clientId}
        viewing={viewing}
        open={editing}
        onOpenChange={setEditing}
      />
    </li>
  );
}
