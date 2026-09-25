"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowRight,
  Building2,
  Globe2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
  Tag as TagIcon,
  UserRound,
} from "lucide-react";

import { ClientAvatar } from "@/components/clients/client-avatar";
import { StageBadge } from "@/components/clients/stage-badge";
import { ContactButtons } from "@/components/clients/contact-log";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tag } from "@/components/ui/tag";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import {
  dealTypeLabel,
  languageLabel,
  nationalityLabel,
  sellerRoleLabel,
  sideLabel,
  stageLabel,
} from "@/i18n/labels";
import { clientFullName, stagesForSide, type ClientSide } from "@/lib/crm";
import type { ClientRow } from "@/lib/data/clients";
import { cn } from "@/lib/utils";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b px-5 py-4 last:border-b-0">
      <h4 className="label-caps text-muted-foreground mb-3">{title}</h4>
      {children}
    </section>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="mt-1.5 text-sm font-medium tabular-nums">{children}</div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  if (!value) return null;
  const body = (
    <>
      <span className="text-muted-foreground mt-0.5 shrink-0 [&>svg]:size-4">{icon}</span>
      <span className="min-w-0">
        <span className="text-muted-foreground block text-xs">{label}</span>
        <span className="block truncate text-sm font-medium">{value}</span>
      </span>
    </>
  );
  return href ? (
    <a href={href} className="hover:bg-muted/50 -mx-2 flex items-start gap-3 rounded-md px-2 py-1.5 transition-colors duration-150">
      {body}
    </a>
  ) : (
    <div className="-mx-2 flex items-start gap-3 px-2 py-1.5">{body}</div>
  );
}

/**
 * A client at a glance without leaving the list: who they are, how to reach
 * them, where they stand, and the door to the full page. The stage can be
 * changed right here; anything deeper goes through the client page.
 */
export function ClientSheet({
  row,
  side,
  open,
  onOpenChange,
  onTogglePriority,
  onStageChange,
}: {
  row: ClientRow | null;
  side: ClientSide;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTogglePriority: (id: string, next: boolean) => void;
  onStageChange: (id: string, stage: string) => void;
}) {
  const t = useTranslations("clients.sheet");
  const tDetail = useTranslations("clientDetail.page");
  const tPriority = useTranslations("clients.priority");
  const tCommon = useTranslations("common");
  const tCrm = useTranslations("crm");
  const locale = useLocale();
  const tag = intlTag(locale);
  const isBuyer = side === "buyer";

  const c = row;
  const typeLabel = c
    ? isBuyer
      ? c.deal_type
        ? dealTypeLabel(tCrm, c.deal_type)
        : null
      : c.seller_role
        ? sellerRoleLabel(tCrm, c.seller_role)
        : null
    : null;
  const hasContact = Boolean(c?.email || c?.phone);
  const hasDetails = Boolean(c?.language || c?.nationality || c?.agency || typeLabel);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="gap-0 sm:max-w-md"
        // Focus the panel, not the stage select: nothing should look "chosen"
        // the moment the sheet opens.
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {c ? (
          <>
            <SheetHeader className="flex-row items-center gap-2 border-b py-3.5 pr-14">
              <SheetTitle className="label-caps text-muted-foreground flex items-center gap-2 font-medium">
                <UserRound className="size-3.5" strokeWidth={1.75} />
                {t("title")}
              </SheetTitle>
              <SheetDescription className="sr-only">{clientFullName(c)}</SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <section className="flex items-center gap-4 border-b px-5 py-5">
                <ClientAvatar name={clientFullName(c)} side={c.side} size="lg" />
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold tracking-tight">
                    {clientFullName(c)}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StageBadge stage={c.stage} dot />
                    <Tag>{sideLabel(tCrm, c.side)}</Tag>
                    {c.priority ? (
                      <Tag tone="brand">
                        <Star className="fill-current" />
                        {t("priority")}
                      </Tag>
                    ) : null}
                    {!c.is_active ? <Tag>{tDetail("inactive")}</Tag> : null}
                  </div>
                </div>
              </section>

              <Section title={t("contact")}>
                {hasContact ? (
                  <div className="space-y-0.5">
                    <InfoRow
                      icon={<Mail />}
                      label={tDetail("email")}
                      value={c.email}
                      href={c.email ? `mailto:${c.email}` : undefined}
                    />
                    <InfoRow
                      icon={<Phone />}
                      label={tDetail("phone")}
                      value={c.phone}
                      href={c.phone ? `tel:${c.phone.replace(/\s+/g, "")}` : undefined}
                    />
                    <ContactButtons
                      client={{ id: c.id, firstName: c.first_name, side: c.side, stage: c.stage }}
                      phone={c.phone}
                      language={c.language}
                      className="mt-2"
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{tDetail("contactEmpty")}</p>
                )}
              </Section>

              <Section title={t("pipeline")}>
                <div className="grid grid-cols-2 gap-2">
                  <Stat label={t("stage")}>
                    <Select
                      value={c.stage}
                      onValueChange={(stage) => onStageChange(c.id, stage)}
                    >
                      <SelectTrigger
                        size="sm"
                        className="-mx-2 -my-1 h-7 w-[calc(100%+1rem)] border-0 bg-transparent px-2 text-sm font-medium shadow-none hover:bg-muted/60"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stagesForSide(side).map((s) => (
                          <SelectItem key={s} value={s}>
                            {stageLabel(tCrm, s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Stat>
                  <Stat label={isBuyer ? t("budget") : t("askingPrice")}>
                    {isBuyer ? (
                      c.budget_max ?? c.budget_min ? (
                        <Money value={c.budget_max ?? c.budget_min} locale={tag} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    ) : (
                      <Money value={c.asking_price} locale={tag} />
                    )}
                  </Stat>
                  <Stat label={isBuyer ? t("viewings") : t("properties")}>
                    {isBuyer ? c.viewing_count : c.property_count}
                  </Stat>
                  <Stat label={t("lastActivity")}>
                    <span className="font-normal">
                      {formatDistanceToNowStrict(new Date(c.updated_at), {
                        addSuffix: true,
                        locale: dateFnsLocale(locale),
                      })}
                    </span>
                  </Stat>
                </div>
              </Section>

              {hasDetails ? (
                <Section title={t("details")}>
                  <div className="space-y-0.5">
                    <InfoRow
                      icon={<Globe2 />}
                      label={tDetail("language")}
                      value={languageLabel(tCrm, c.language)}
                    />
                    <InfoRow
                      icon={<MapPin />}
                      label={tDetail("nationality")}
                      value={nationalityLabel(tCrm, c.nationality)}
                    />
                    <InfoRow
                      icon={<TagIcon />}
                      label={isBuyer ? tDetail("dealType") : tDetail("role")}
                      value={typeLabel}
                    />
                    <InfoRow
                      icon={<Building2 />}
                      label={tDetail("agency")}
                      value={c.agency}
                    />
                  </div>
                </Section>
              ) : null}

              <Section title={tDetail("notes")}>
                {c.notes ? (
                  <p className="text-muted-foreground line-clamp-4 text-sm whitespace-pre-wrap">
                    {c.notes}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">{tDetail("notesEmpty")}</p>
                )}
              </Section>
            </div>

            <SheetFooter className="flex-row items-center justify-between gap-2 border-t">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onTogglePriority(c.id, !c.priority)}
                  aria-label={c.priority ? tPriority("unflag") : tPriority("flag")}
                  title={c.priority ? tPriority("unflag") : tPriority("flag")}
                >
                  <Star className={cn(c.priority && "fill-primary text-primary")} />
                </Button>
                <Button asChild variant="ghost" size="icon-sm">
                  <Link href={`/clients/${c.id}/edit`} aria-label={tCommon("edit")} title={tCommon("edit")}>
                    <Pencil />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <SheetClose asChild>
                  <Button variant="outline" size="sm">
                    {tCommon("close")}
                  </Button>
                </SheetClose>
                <Button asChild size="sm">
                  <Link href={`/clients/${c.id}`}>
                    {t("open")} <ArrowRight />
                  </Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
