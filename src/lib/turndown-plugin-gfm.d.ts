// @joplin/turndown-plugin-gfm ships no types; this covers the export we use.
declare module "@joplin/turndown-plugin-gfm" {
  import type TurndownService from "turndown";

  export const tables: TurndownService.Plugin;
}
