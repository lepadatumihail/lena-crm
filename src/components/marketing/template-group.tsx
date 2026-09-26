"use client";

import { Children, cloneElement, isValidElement, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { languageName } from "@/components/marketing/language-name";
import { intlTag } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** What the group needs to know about a child to turn it into a tab. */
type BlockProps = {
  lang: string;
  hideLanguage?: boolean;
  className?: string;
};

function isBlock(child: React.ReactNode): child is React.ReactElement<BlockProps> {
  return (
    isValidElement(child) && typeof (child.props as Partial<BlockProps>)?.lang === "string"
  );
}

/**
 * One moment, one card: the same message in several languages, shown one at a
 * time behind a row of tabs. Every version stays in the DOM — the inactive
 * ones are display:none via a class, not unmounted and not the `hidden`
 * attribute, because the markdown twin of these pages (html-to-markdown.ts)
 * drops `[hidden]` elements and agents should read all three languages —
 * so crawlers and readers who search the page still find the Spanish and
 * German wording, while the page stops being a wall of three near-identical
 * cards. Copy only ever sees the visible one.
 *
 * Children are `<TemplateBlock>` elements; each one's `lang` names its tab.
 * Anything without a `lang` is not a tab and is rendered after the cards.
 */
export function TemplateGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("marketing.template");
  const tag = intlTag(useLocale());
  const id = useId();
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const all = Children.toArray(children);
  const blocks = all.filter(isBlock);
  const rest = all.filter((child) => !isBlock(child));
  if (blocks.length === 0) return <>{children}</>;

  const tabId = (index: number) => `${id}-tab-${index}`;
  const panelId = (index: number) => `${id}-panel-${index}`;

  /** Arrow keys move along the row and take focus with them; Home/End jump. */
  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = blocks.length - 1;
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % blocks.length
        : event.key === "ArrowLeft"
          ? (index + last) % blocks.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className={cn("mt-6", className)}>
      <div
        role="tablist"
        aria-label={t("language")}
        className="bg-muted inline-flex rounded-lg p-1 text-sm"
      >
        {blocks.map((block, index) => (
          <button
            key={index}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={tabId(index)}
            aria-selected={index === selected}
            aria-controls={panelId(index)}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "rounded-md px-4 py-1.5 transition-colors",
              index === selected
                ? "bg-background text-foreground font-medium shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {languageName(block.props.lang, tag)}
          </button>
        ))}
      </div>
      {blocks.map((block, index) => (
        <div
          key={index}
          role="tabpanel"
          id={panelId(index)}
          aria-labelledby={tabId(index)}
          className={index === selected ? undefined : "hidden"}
        >
          {cloneElement(block, {
            hideLanguage: true,
            className: cn("mt-3", block.props.className),
          })}
        </div>
      ))}
      {rest}
    </div>
  );
}
