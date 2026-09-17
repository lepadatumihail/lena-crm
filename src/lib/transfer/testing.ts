import { createTranslator } from "next-intl";

import type { AppLocale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

import type { TransferContext } from "./format";

/** A transfer context on the real catalogs, for tests: a reworded key fails there. */
export function contextFor(locale: AppLocale, timeZone = "Europe/Madrid"): TransferContext {
  const messages = messagesFor(locale);
  return {
    locale,
    timeZone,
    t: createTranslator({ locale, messages, namespace: "crm" }),
    tt: createTranslator({ locale, messages, namespace: "transfer" }),
  };
}
