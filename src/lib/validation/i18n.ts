import type enValidation from "../../../messages/en/validation.json";

export type ValidationKey = keyof typeof enValidation;

/**
 * Translator for form messages. Schemas are factories that take one of these
 * so the same schema validates in the browser (`useTranslations("validation")`)
 * and in server actions (`await getTranslations("validation")`) in the agent's
 * language. Tests can pass `(key) => key`.
 */
export type ValidationT = (
  key: ValidationKey,
  values?: Record<string, string | number>
) => string;
