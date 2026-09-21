"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";

import { asLocale } from "@/i18n/config";
import {
  CONSENT_OPEN_EVENT,
  readConsent,
  subscribeConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/consent";
import { marketingPath, marketingRouteAt } from "@/lib/routes";
import { META_PIXEL_ID } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { MetaPixel } from "@/components/marketing/meta-pixel";

/** The stored answer, "none" when the visitor has not answered, "unknown" before hydration. */
type ConsentState = ConsentChoice | "none" | "unknown";

const readState = (): ConsentState => readConsent() ?? "none";
const serverState = (): ConsentState => "unknown";

/**
 * Ad measurement on the public website, and the notice that asks for it.
 * Mounted once in the root layout; it renders nothing unless the URL is a
 * marketing page and a pixel id is configured, so the signed-in app, the
 * sign-in pages and every deployment without NEXT_PUBLIC_META_PIXEL_ID stay
 * exactly as they were. The stored answer lives in localStorage, so the
 * server renders "unknown" and the client swaps in the real answer after
 * hydration: the notice never flashes on a page that already has one.
 */
export function MarketingTracking() {
  const pathname = usePathname();
  const state = useSyncExternalStore(subscribeConsent, readState, serverState);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const onOpen = () => setReopened(true);
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  if (!META_PIXEL_ID || !marketingRouteAt(pathname)) return null;

  const choose = (choice: ConsentChoice) => {
    writeConsent(choice);
    setReopened(false);
  };

  return (
    <>
      <MetaPixel pixelId={META_PIXEL_ID} enabled={state === "granted"} />
      {state === "none" || (state !== "unknown" && reopened) ? (
        <ConsentNotice onChoose={choose} />
      ) : null}
    </>
  );
}

/**
 * A small card in the corner, not a wall: the visitor can keep reading and
 * answer when they like. Both answers are one tap and carry equal weight.
 */
function ConsentNotice({ onChoose }: { onChoose: (choice: ConsentChoice) => void }) {
  const t = useTranslations("marketing.consent");
  const locale = asLocale(useLocale());

  return (
    <section
      role="region"
      aria-label={t("title")}
      className="bg-card text-card-foreground fixed inset-x-4 bottom-4 z-[1500] mx-auto max-w-md rounded-xl border p-4 shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-sm"
    >
      <p className="text-sm font-semibold">{t("title")}</p>
      <p className="text-muted-foreground mt-1 text-sm">
        {t("body")}{" "}
        <Link
          href={marketingPath("privacy", locale)}
          className="text-foreground underline underline-offset-4"
        >
          {t("privacy")}
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => onChoose("granted")}>
          {t("accept")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onChoose("denied")}>
          {t("decline")}
        </Button>
      </div>
    </section>
  );
}
