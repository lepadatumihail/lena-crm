# design-sync notes — Lena

Repo-specific gotchas for syncing this design system to claude.ai/design.
Read this before any re-sync.

## This repo is an APP, not a packaged component library
- No `dist/`, no library entry in `package.json`, no Storybook. `shape: "package"`, synth-entry territory.
- The design system = the shadcn primitives in `src/components/ui/` (20 files) + the Tailwind v4 tokens in `src/app/globals.css` + Geist fonts. Feature components (clients-table, calculator-screen, …) are app glue — out of scope.

## Build setup (proven working on the feasibility set: Button, Badge, Card, Input)
- **Scoped re-export entry** at `.design-sync/.cache/ds-entry.tsx` (gitignored) re-exports ONLY `ui/` primitives. This keeps server-only code (`next/headers`, the Supabase server client, `"use server"` actions) out of the browser bundle. Pure synth-entry (`export * from <all src>`) would pull that in and fail.
- `--entry` at that file anchors `PKG_DIR` to the repo root (pkg name "lena"); without it the converter looks for `node_modules/lena` which doesn't exist.
- `cfg.tsconfig: "tsconfig.json"` → the converter's tsconfig-paths plugin resolves `@/…` imports.
- **No shipped CSS** (utility-class DS): `cfg.cssEntry` points at a compiled Tailwind stylesheet, regenerated each build. The Geist font vars (`--font-geist-sans`/`-mono`) and the remote `@font-face` `@import` are NOT in `globals.css` (next/font injects them at runtime in the app), so we PREPEND the committed `.design-sync/fonts-geist.css` to the Tailwind output so the `@import` leads the file:
  ```
  npx @tailwindcss/cli@^4 -i src/app/globals.css -o .design-sync/.cache/_tw.css
  cat .design-sync/fonts-geist.css .design-sync/.cache/_tw.css > .design-sync/.cache/compiled.css
  ```
  (both `.cache` files gitignored → MUST be regenerated on every sync before the converter runs; `fonts-geist.css` IS committed).
- Build command:
  `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry .design-sync/.cache/ds-entry.tsx --out ./ds-bundle`

## Verified styled in-browser (all 4 uploaded primitives)
- Authored previews for **Button, Badge, Card, Input** (`previews/*.tsx`), all render fully styled with real Lena tokens (terracotta `--primary`, warm `bg-card`, `success`/`warning` badge tones, destructive red aria-invalid ring) AND Geist fonts. Grades in `.cache/review/*.grade.json`, all `good`.

## Render check / browser
- No playwright cache; Homebrew `chromium` is a dangling symlink. The `package-validate.mjs` playwright render check needs playwright+chromium (~200MB). We did NOT install it — instead ran `package-validate.mjs --no-render-check` (clears all non-render gates) and verified renders manually with **Google Chrome headless**: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --allow-file-access-from-files --hide-scrollbars --force-device-scale-factor=2 --window-size=1100,900 --virtual-time-budget=6000 --default-background-color=FFFFFFFF --screenshot=out.png "file://<abs>/ds-bundle/components/general/<Name>/<Name>.html"`. Chrome must have network for the remote Geist @import. Grades written by hand from those screenshots.
- For a future full run that wants the automated `.render-check.json` + contact sheets, install playwright+chromium (matching versions) per the skill §4.1.

## Current sync state (2026-06-18)
- **Project:** "Lena UI" → `00d21a83-9ef2-4f9a-aaa1-7806add96cdb` (pinned in config.json). https://claude.ai/design/p/00d21a83-9ef2-4f9a-aaa1-7806add96cdb
- **Scope uploaded: 16 of 19 primitives.** Live: Button, Badge, Card, Input, Label, Textarea, Separator, Skeleton, Switch, Table, Select, InputOTP, Dialog, Popover, Tooltip, Sheet. NOT yet synced (the "Complex 3"): **Sidebar** (provider), **Sonner** (needs `next-themes`), **Calendar** (react-day-picker). To add: widen `cfg.componentSrcMap` + `ds-entry.tsx` re-exports and handle their gotchas below.
- **Overlays** (Dialog, Sheet, Popover, Select, Tooltip) use `cfg.overrides.<Name>.cardMode:"single"` + a `viewport`, and their previews force the open state (`defaultOpen`, `modal={false}` to avoid scroll-lock). Tooltip self-wraps its provider, so no global `cfg.provider` was needed. No provider needed for any of the 16.
- **Chrome render note:** Radix Select's open popper did NOT paint in the static Chrome screenshot (portal/position timing) but renders fine in the live Design pane — don't treat a blank Select screenshot as a defect.

## Re-sync risks / TODO for the full run
- **Auth:** resolved — user ran `/login`, design scopes granted. (A fresh session without scopes would block `DesignSync` again.)
- **Fonts:** resolved via REMOTE `@import` (Google Fonts Geist + Geist Mono) in `fonts-geist.css`, prepended to compiled.css. Validate now prints `[FONT_REMOTE]` (informational), no longer `[FONT_MISSING]`. Fidelity depends on network at render time; if offline self-hosting is wanted later, extract the real woff2 from `.next/static/media` and wire `cfg.extraFonts` instead.
- **`[TOKENS_MISSING]` radix vars** (`--radix-select-*`, `--sidebar-width`, etc.) are runtime-injected by components NOT in the current 4-scope — expected absent. They'll resolve when those components render with their providers in the full run.
- **Component gotchas not yet handled** (full 20-primitive run):
  - `Sonner` (toaster) imports `next-themes` — NOT in deps; either add it, stub the provider, or exclude Sonner.
  - `Sidebar`, `Dialog`, `Select`, `Tooltip`, `Popover`, `Sheet` — Radix portals + context; need `cfg.provider` and `cfg.overrides.<Name>.cardMode: "single"` for open/overlay states.
  - `Calendar` (react-day-picker), `Form` (react-hook-form context) — compose inside a realistic parent.
- `cssEntry` compiled.css is gitignored → re-sync must recompile it first (see Build setup).
