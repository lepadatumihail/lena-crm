"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendPageEnquiry, type EnquiryResult } from "@/lib/actions/agent-pages";
import type { PageLang } from "@/lib/agent-pages/content";
import { fill, type PageCopy, type ReplyBucket } from "@/lib/agent-pages/copy";
import {
  BEDS,
  BUDGETS,
  HOME_TYPES,
  SELL_WHEN,
  WHEN,
  type BedsKey,
  type BudgetKey,
  type HomeType,
  type SellWhenKey,
  type WhenKey,
} from "@/lib/agent-pages/enquiry";
import { trackSiteEvent } from "@/lib/site-events";
import { cn } from "@/lib/utils";

type ErrorKey = Exclude<EnquiryResult, { ok: true }>["error"];

/**
 * The page's form: buying or selling, a few taps for the wishes, then a name
 * and one contact field. Big targets, because most visitors arrive on a phone
 * from a WhatsApp or Instagram link. Nothing is required but the name and a
 * way to reply; the server checks everything again.
 */
export function EnquiryForm({
  slug,
  lang,
  copy,
  agentName,
  areas,
  offerBuy,
  offerSell,
  reply,
  isExample,
  privacyHref,
}: {
  slug: string;
  lang: PageLang;
  copy: PageCopy;
  agentName: string;
  areas: string[];
  offerBuy: boolean;
  offerSell: boolean;
  reply: ReplyBucket | null;
  isExample: boolean;
  privacyHref: string;
}) {
  const name = { name: agentName };
  const [kind, setKind] = useState<"buy" | "sell">(offerBuy || !offerSell ? "buy" : "sell");
  const [budget, setBudget] = useState<BudgetKey | null>(null);
  const [beds, setBeds] = useState<BedsKey | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [notSure, setNotSure] = useState(false);
  const [when, setWhen] = useState<WhenKey | null>(null);
  const [homeType, setHomeType] = useState<HomeType | null>(null);
  const [sellWhen, setSellWhen] = useState<SellWhenKey | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const openedAt = useRef<number | null>(null);
  const started = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    openedAt.current = performance.now();
  }, []);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackSiteEvent("agent_enquiry_start");
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markStarted();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();
    const fullName = text("name");
    const contact = text("contact");
    if (!fullName) {
      setError("name");
      nameRef.current?.focus();
      return;
    }
    if (contact.length < 3) {
      setError("contact");
      contactRef.current?.focus();
      return;
    }
    const elapsedMs = Math.round(performance.now() - (openedAt.current ?? performance.now()));
    const isBuy = kind === "buy";
    startTransition(async () => {
      let result: EnquiryResult;
      try {
        result = await sendPageEnquiry({
          slug,
          lang,
          kind,
          name: fullName,
          contact,
          message: text("message") || undefined,
          budget: isBuy ? (budget ?? undefined) : undefined,
          beds: isBuy ? (beds ?? undefined) : undefined,
          areas: isBuy && !notSure ? picked : undefined,
          when: isBuy ? (when ?? undefined) : undefined,
          where: isBuy ? undefined : text("where") || undefined,
          homeType: isBuy ? undefined : (homeType ?? undefined),
          sellWhen: isBuy ? undefined : (sellWhen ?? undefined),
          company: text("company") || undefined,
          elapsedMs,
        });
      } catch {
        result = { ok: false, error: "server" };
      }
      if (result.ok) {
        setError(null);
        setSent(true);
        trackSiteEvent("agent_enquiry_sent");
        requestAnimationFrame(() => titleRef.current?.focus());
      } else {
        setError(result.error);
        if (result.error === "name") nameRef.current?.focus();
        if (result.error === "contact") contactRef.current?.focus();
      }
    });
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start gap-3">
        <span
          aria-hidden="true"
          className="bg-tone-green-soft text-tone-green-ink inline-flex size-12 items-center justify-center rounded-full"
        >
          <Check className="size-6" strokeWidth={2.25} />
        </span>
        <h2
          ref={titleRef}
          tabIndex={-1}
          className="font-display text-[1.875rem] leading-tight outline-none"
        >
          {fill(copy.sentTitle, name)}
        </h2>
        <p className="text-foreground/85">{fill(copy.sentBody[reply ?? "none"], name)}</p>
        {isExample ? <p className="text-muted-foreground text-sm">{copy.exampleSent}</p> : null}
        <Button
          type="button"
          variant="link"
          className="h-11 px-0 text-[15px] underline underline-offset-4"
          onClick={() => setSent(false)}
        >
          {copy.sendAnother}
        </Button>
      </div>
    );
  }

  const isBuy = kind === "buy";
  return (
    <form onSubmit={submit} onFocus={markStarted} noValidate className="flex flex-col gap-5">
      <h2 id="enquiry-title" className="font-display text-[1.875rem] leading-tight">
        {isBuy ? copy.formTitleBuy : fill(copy.formTitleSell, name)}
      </h2>

      {offerBuy && offerSell ? (
        <div role="group" aria-label={copy.tabsLabel} className="bg-muted flex gap-1 rounded-xl p-1">
          {(["buy", "sell"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => {
                markStarted();
                setKind(k);
              }}
              className={cn(
                "min-h-11 flex-1 rounded-lg text-[15px] outline-none transition-[color,background-color,box-shadow] duration-150",
                "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                kind === k
                  ? "bg-background text-foreground font-medium shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {k === "buy" ? copy.tabBuy : copy.tabSell}
            </button>
          ))}
        </div>
      ) : null}

      {isBuy ? (
        <>
          <ChipGroup legend={copy.budget}>
            {BUDGETS.map((b, i) => (
              <Chip
                key={b.key}
                pressed={budget === b.key}
                onClick={() => setBudget(budget === b.key ? null : b.key)}
              >
                {copy.budgetOpts[i]}
              </Chip>
            ))}
          </ChipGroup>
          <ChipGroup legend={copy.beds}>
            {BEDS.map((b) => (
              <Chip key={b} pressed={beds === b} onClick={() => setBeds(beds === b ? null : b)}>
                {b}
              </Chip>
            ))}
          </ChipGroup>
          {areas.length ? (
            <ChipGroup legend={copy.where}>
              {areas.map((area) => {
                const on = !notSure && picked.includes(area);
                return (
                  <Chip
                    key={area}
                    pressed={on}
                    onClick={() => {
                      setNotSure(false);
                      setPicked(on ? picked.filter((a) => a !== area) : [...picked, area]);
                    }}
                  >
                    {area}
                  </Chip>
                );
              })}
              <Chip
                pressed={notSure}
                onClick={() => {
                  setNotSure(!notSure);
                  setPicked([]);
                }}
              >
                {copy.notSure}
              </Chip>
            </ChipGroup>
          ) : null}
          <ChipGroup legend={copy.when}>
            {WHEN.map((w, i) => (
              <Chip key={w} pressed={when === w} onClick={() => setWhen(when === w ? null : w)}>
                {copy.whenOpts[i]}
              </Chip>
            ))}
          </ChipGroup>
        </>
      ) : (
        <>
          <Field id="enquiry-where" label={copy.sellWhere}>
            <Input
              id="enquiry-where"
              name="where"
              maxLength={120}
              placeholder={copy.sellWherePh}
              className="h-12 text-base md:text-base"
            />
          </Field>
          <ChipGroup legend={copy.sellType}>
            {HOME_TYPES.map((h, i) => (
              <Chip
                key={h}
                pressed={homeType === h}
                onClick={() => setHomeType(homeType === h ? null : h)}
              >
                {copy.typeOpts[i]}
              </Chip>
            ))}
          </ChipGroup>
          <ChipGroup legend={copy.sellWhen}>
            {SELL_WHEN.map((w, i) => (
              <Chip
                key={w}
                pressed={sellWhen === w}
                onClick={() => setSellWhen(sellWhen === w ? null : w)}
              >
                {copy.sellWhenOpts[i]}
              </Chip>
            ))}
          </ChipGroup>
        </>
      )}

      <Field id="enquiry-name" label={copy.name}>
        <Input
          ref={nameRef}
          id="enquiry-name"
          name="name"
          autoComplete="name"
          maxLength={120}
          placeholder={copy.namePh}
          aria-invalid={error === "name" || undefined}
          className="h-12 text-base md:text-base"
        />
      </Field>
      <Field id="enquiry-contact" label={copy.contact}>
        <Input
          ref={contactRef}
          id="enquiry-contact"
          name="contact"
          maxLength={200}
          placeholder={copy.contactPh}
          aria-invalid={error === "contact" || undefined}
          className="h-12 text-base md:text-base"
        />
      </Field>
      <Field id="enquiry-message" label={copy.msg}>
        <Textarea
          id="enquiry-message"
          name="message"
          rows={3}
          maxLength={2000}
          placeholder={copy.msgPh}
          className="min-h-24 text-base md:text-base"
        />
      </Field>

      {/* People never see this field; form-filling bots do, and fill it. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="enquiry-company">Company</label>
        <input id="enquiry-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {copy.errors[error]}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="h-12 text-base">
        {pending ? copy.sending : fill(copy.send, name)}
      </Button>
      <p className="text-muted-foreground text-[13px] leading-relaxed">
        {fill(copy.privacy, name)}{" "}
        <a href={privacyHref} className="text-foreground underline underline-offset-4">
          {copy.privacyLink}
        </a>
      </p>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function ChipGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 p-0 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

/** A toggle chip: a rectangle like the app's chips, the chosen one in the brand's soft indigo. */
function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center rounded-lg border px-3.5 text-sm outline-none",
        "transition-[color,background-color,border-color,scale] duration-150 active:scale-[0.97]",
        "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        pressed
          ? "border-primary/50 bg-tone-indigo-soft text-tone-indigo-ink font-medium"
          : "border-input bg-background text-foreground/80 hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
