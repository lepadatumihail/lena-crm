import { utmQuery } from "@/lib/signup-source";

/**
 * The address a calculator writes for its inputs (`query`): the path, the
 * inputs, then the utm tags the visit arrived with, then the hash. Rewriting
 * the address used to drop the tags a second after the page opened, so a
 * sign-up on a calculator lost the ad or assistant that brought it. The link
 * the copy buttons share is built from the inputs alone and stays untagged.
 */
export function calculatorHref(
  location: Pick<Location, "pathname" | "search" | "hash">,
  query: string
): string {
  const params = [query, utmQuery(location.search)].filter(Boolean).join("&");
  return `${location.pathname}${params ? `?${params}` : ""}${location.hash}`;
}
