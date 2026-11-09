"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";

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

const STEP_IN = "motion-safe:[animation:agent-step-in_280ms_var(--ease-out-quint)_both]";

/** Milliseconds since `start` on the page clock; for event handlers, never render. */
function elapsedSince(start: number | null): number {
  const now = performance.now();
  return Math.round(now - (start ?? now));
}

/**
 * The page's form, in two short steps: first the wishes, all taps (budget,
 * bedrooms, where, when; or, for a seller, the home), then a name and one
 * way to reply. Only the second step asks for anything, so starting costs
 * nothing. Targets are at least 40 px, chips keep their width when picked so
 * a row never jumps, and the server checks everything again.
 */
export function EnquiryForm({
  slug,
  lang,
  copy,
  agentName,
  initials,
  photoUrl,
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
  initials: string;
  photoUrl: string | null;
  areas: string[];
  offerBuy: boolean;
  offerSell: boolean;
  reply: ReplyBucket | null;
  isExample: boolean;
  privacyHref: string;
}) {
  const name = { name: agentName };
  const [kind, setKind] = useState<"buy" | "sell">(offerBuy || !offerSell ? "buy" : "sell");
  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [budget, setBudget] = useState<BudgetKey | null>(null);
  const [beds, setBeds] = useState<BedsKey | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [notSure, setNotSure] = useState(false);
  const [when, setWhen] = useState<WhenKey | null>(null);
  const [where, setWhere] = useState("");
  const [homeType, setHomeType] = useState<HomeType | null>(null);
  const [sellWhen, setSellWhen] = useState<SellWhenKey | null>(null);
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<ErrorKey | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const openedAt = useRef<number | null>(null);
  const started = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    openedAt.current = performance.now();
  }, []);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackSiteEvent("agent_enquiry_start");
  };

  const focusTitle = () => requestAnimationFrame(() => titleRef.current?.focus());

  function goTo(next: 1 | 2) {
    markStarted();
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError(null);
    focusTitle();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1) {
      goTo(2);
      return;
    }
    markStarted();
    if (!fullName.trim()) {
      setError("name");
      nameRef.current?.focus();
      return;
    }
    if (contact.trim().length < 3) {
      setError("contact");
      contactRef.current?.focus();
      return;
    }
    const elapsedMs = elapsedSince(openedAt.current);
    const isBuy = kind === "buy";
    startTransition(async () => {
      let result: EnquiryResult;
      try {
        result = await sendPageEnquiry({
          slug,
          lang,
          kind,
          name: fullName.trim(),
          contact: contact.trim(),
          message: message.trim() || undefined,
          budget: isBuy ? (budget ?? undefined) : undefined,
          beds: isBuy ? (beds ?? undefined) : undefined,
          areas: isBuy && !notSure ? picked : undefined,
          when: isBuy ? (when ?? undefined) : undefined,
          where: isBuy ? undefined : where.trim() || undefined,
          homeType: isBuy ? undefined : (homeType ?? undefined),
          sellWhen: isBuy ? undefined : (sellWhen ?? undefined),
          company: honeypotRef.current?.value.trim() || undefined,
          elapsedMs,
        });
      } catch {
        result = { ok: false, error: "server" };
      }
      if (result.ok) {
        setError(null);
        setSent(true);
        trackSiteEvent("agent_enquiry_sent");
        focusTitle();
      } else {
        setError(result.error);
        if (result.error === "name") nameRef.current?.focus();
        if (result.error === "contact") contactRef.current?.focus();
      }
    });
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 py-1">
        <span
          aria-hidden="true"
          className="bg-tone-green-soft text-tone-green-ink inline-flex size-14 items-center justify-center rounded-full motion-safe:[animation:agent-pop_420ms_var(--ease-out-quint)_both]"
        >
          <Check className="size-7" strokeWidth={2.25} />
        </span>
        <h2
          id="enquiry-title"
          ref={titleRef}
          tabIndex={-1}
          className="font-display mt-2 text-[1.625rem] leading-tight font-medium tracking-[-0.03em] outline-none"
        >
          {fill(copy.sentTitle, name)}
        </h2>
        <p className="text-foreground/80 text-[15px] leading-relaxed">
          {fill(copy.sentBody[reply ?? "none"], name)}
        </p>
        {isExample ? <p className="text-muted-foreground text-sm">{copy.exampleSent}</p> : null}
        <Button
          type="button"
          variant="link"
          className="h-11 px-0 text-[15px] underline underline-offset-4"
          onClick={() => {
            setSent(false);
            setStep(1);
            setDirection(-1);
            setMessage("");
          }}
        >
          {copy.sendAnother}
        </Button>
      </div>
    );
  }

  const isBuy = kind === "buy";
  const stepLabel = fill(copy.stepOf, { n: String(step) });
  const title =
    step === 2
      ? fill(copy.detailsTitle, name)
      : isBuy
        ? copy.formTitleBuy
        : fill(copy.formTitleSell, name);

  return (
    <div>
      {/* Who you are writing to */}
      <div className="flex items-center gap-3">
        <span className="ring-background relative size-10 shrink-0 overflow-hidden rounded-full ring-2">
          {photoUrl ? (
            <Image src={photoUrl} alt="" width={80} height={80} className="size-full object-cover" />
          ) : (
            <span
              aria-hidden="true"
              className="text-tone-indigo-ink font-display flex size-full items-center justify-center bg-[linear-gradient(140deg,var(--tone-indigo-soft),var(--tone-teal-soft))] text-[13px] font-medium"
            >
              {initials}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] leading-tight font-medium">{agentName}</p>
          <p className="text-muted-foreground mt-0.5 truncate text-[13px]">
            {reply ? copy.replyBadge[reply] : copy.repliesVia}
          </p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="mt-6 flex flex-col sm:mt-5">
        <div aria-hidden="true" className="flex gap-1.5">
          {[1, 2].map((n) => (
            <span
              key={n}
              className={cn(
                "h-1 flex-1 rounded-full transition-[background-color] duration-300",
                n <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-muted-foreground mt-3 text-[13px]">{stepLabel}</p>
        <h2
          id="enquiry-title"
          ref={titleRef}
          tabIndex={-1}
          className="font-display mt-1 text-[1.625rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance outline-none sm:text-[1.5rem]"
        >
          {title}
        </h2>

        <div
          key={`${step}-${kind}`}
          style={{ "--agent-step-from": direction > 0 ? "14px" : "-14px" } as CSSProperties}
          className={cn("mt-5 flex flex-col gap-5 sm:gap-4", STEP_IN)}
        >
          {step === 1 && offerBuy && offerSell ? (
            <div role="group" aria-label={copy.tabsLabel} className="bg-muted flex gap-1 rounded-full p-1">
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
                    "h-10 flex-1 rounded-full text-sm outline-none transition-[color,background-color,box-shadow] duration-200 select-none [touch-action:manipulation] [@media(pointer:fine)]:h-9",
                    "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    kind === k
                      ? "bg-background text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.1)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {k === "buy" ? copy.tabBuy : copy.tabSell}
                </button>
              ))}
            </div>
          ) : null}

          {step === 1 && isBuy ? (
            <>
              <ChipGroup legend={copy.budget}>
                {BUDGETS.map((b, i) => (
                  <Chip
                    key={b.key}
                    pressed={budget === b.key}
                    onClick={() => {
                      markStarted();
                      setBudget(budget === b.key ? null : b.key);
                    }}
                  >
                    {copy.budgetOpts[i]}
                  </Chip>
                ))}
              </ChipGroup>
              <ChipGroup legend={copy.beds}>
                {BEDS.map((b) => (
                  <Chip
                    key={b}
                    pressed={beds === b}
                    className="min-w-12 justify-center"
                    onClick={() => {
                      markStarted();
                      setBeds(beds === b ? null : b);
                    }}
                  >
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
                          markStarted();
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
                      markStarted();
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
                  <Chip
                    key={w}
                    pressed={when === w}
                    onClick={() => {
                      markStarted();
                      setWhen(when === w ? null : w);
                    }}
                  >
                    {copy.whenOpts[i]}
                  </Chip>
                ))}
              </ChipGroup>
            </>
          ) : null}

          {step === 1 && !isBuy ? (
            <>
              <Field id="enquiry-where" label={copy.sellWhere}>
                <Input
                  id="enquiry-where"
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  maxLength={120}
                  placeholder={copy.sellWherePh}
                  enterKeyHint="next"
                  className="h-12 rounded-xl px-3.5 text-base md:text-base"
                />
              </Field>
              <ChipGroup legend={copy.sellType}>
                {HOME_TYPES.map((h, i) => (
                  <Chip
                    key={h}
                    pressed={homeType === h}
                    onClick={() => {
                      markStarted();
                      setHomeType(homeType === h ? null : h);
                    }}
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
                    onClick={() => {
                      markStarted();
                      setSellWhen(sellWhen === w ? null : w);
                    }}
                  >
                    {copy.sellWhenOpts[i]}
                  </Chip>
                ))}
              </ChipGroup>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Field id="enquiry-name" label={copy.name}>
                <Input
                  ref={nameRef}
                  id="enquiry-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  enterKeyHint="next"
                  maxLength={120}
                  placeholder={copy.namePh}
                  aria-invalid={error === "name" || undefined}
                  className="h-12 rounded-xl px-3.5 text-base md:text-base"
                />
              </Field>
              <Field id="enquiry-contact" label={copy.contact}>
                <Input
                  ref={contactRef}
                  id="enquiry-contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  enterKeyHint="next"
                  maxLength={200}
                  placeholder={copy.contactPh}
                  aria-invalid={error === "contact" || undefined}
                  className="h-12 rounded-xl px-3.5 text-base md:text-base"
                />
              </Field>
              <Field id="enquiry-message" label={copy.msg}>
                <Textarea
                  id="enquiry-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={copy.msgPh}
                  className="min-h-24 rounded-xl px-3.5 py-3 text-base md:text-base"
                />
              </Field>
              {/* People never see this field; form-filling bots do, and fill it. */}
              <div aria-hidden="true" className="sr-only">
                <label htmlFor="enquiry-company">Company</label>
                <input ref={honeypotRef} id="enquiry-company" name="company" tabIndex={-1} autoComplete="off" />
              </div>
            </>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-destructive mt-4 text-sm">
            {copy.errors[error]}
          </p>
        ) : null}

        {step === 1 ? (
          <Button type="submit" size="lg" className="mt-6 h-12 rounded-full text-[15px]">
            {copy.continue}
          </Button>
        ) : (
          <>
            <div className="mt-6 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => goTo(1)}
                className="h-12 rounded-full px-4 text-[15px]"
              >
                <ArrowLeft />
                {copy.back}
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={pending}
                className="h-12 flex-1 rounded-full text-[15px]"
              >
                {pending ? copy.sending : fill(copy.send, name)}
              </Button>
            </div>
            <p className="text-muted-foreground mt-4 text-[12.5px] leading-relaxed">
              {fill(copy.privacy, name)}{" "}
              <a href={privacyHref} className="text-foreground underline underline-offset-4">
                {copy.privacyLink}
              </a>
            </p>
          </>
        )}
      </form>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function ChipGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="text-muted-foreground mb-2.5 p-0 text-[13px] sm:mb-2">{legend}</legend>
      <div className="flex flex-wrap gap-2 sm:gap-1.5">{children}</div>
    </fieldset>
  );
}

/**
 * A toggle chip: a soft pill, the chosen one in the brand's indigo with a
 * hairline ring. The weight never changes, so picking one doesn't reflow the
 * row; it presses down a touch for feedback.
 */
function Chip({
  pressed,
  onClick,
  className,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center rounded-full px-4 text-sm outline-none select-none [touch-action:manipulation] [@media(pointer:fine)]:h-9 [@media(pointer:fine)]:px-3.5",
        "transition-[color,background-color,box-shadow,scale] duration-150 ease-(--ease-out-quint) active:scale-[0.96]",
        "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        pressed
          ? "bg-tone-indigo-soft text-tone-indigo-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
          : "bg-muted/80 text-foreground/80 hover:bg-muted hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}
