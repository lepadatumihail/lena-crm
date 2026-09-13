/**
 * "Español", "Deutsch", … named in the reader's own language; the code if it
 * isn't one. Shared by the template card and the group that switches between
 * cards, so a pill and its tab always read the same.
 */
export function languageName(code: string, tag: string): string {
  try {
    return new Intl.DisplayNames([tag], { type: "language" }).of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}
