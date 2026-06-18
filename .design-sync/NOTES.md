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
- **No shipped CSS** (utility-class DS): `cfg.cssEntry` points at a compiled Tailwind stylesheet, regenerated each build:
  `npx @tailwindcss/cli@^4 -i src/app/globals.css -o .design-sync/.cache/compiled.css`
  (gitignored → MUST be regenerated on every sync before the converter runs).
- Build command:
  `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry .design-sync/.cache/ds-entry.tsx --out ./ds-bundle`

## Verified styled in-browser
- Authored `previews/Button.tsx` renders fully styled with the real Lena tokens (terracotta `--primary`, secondary/destructive/ghost/link, disabled). Screenshot proof captured `/tmp/button-card.png`.

## Render check / browser
- No playwright cache; Homebrew `chromium` is a dangling symlink. Used **Google Chrome headless** directly: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --allow-file-access-from-files --virtual-time-budget=5000 --screenshot=out.png "file://<abs>/ds-bundle/components/.../<Name>.html"`. For the converter's own `package-validate.mjs` render check, playwright+chromium (~200MB) would need installing.

## Re-sync risks / TODO for the full run
- **Auth:** this session's token (`CLAUDE_CODE_OAUTH_TOKEN`) lacks design scopes → `DesignSync` fails until the user runs `/login`. Upload/project-creation is blocked without it.
- **Fonts:** Geist is NOT shipped → cards render in a fallback sans (`[FONT_MISSING]` expected). Wire `cfg.extraFonts` to the Geist `.woff2`/`.ttf` for typographic fidelity (the terracotta brand color is correct already).
- **Component gotchas not yet handled** (full 20-primitive run):
  - `Sonner` (toaster) imports `next-themes` — NOT in deps; either add it, stub the provider, or exclude Sonner.
  - `Sidebar`, `Dialog`, `Select`, `Tooltip`, `Popover`, `Sheet` — Radix portals + context; need `cfg.provider` and `cfg.overrides.<Name>.cardMode: "single"` for open/overlay states.
  - `Calendar` (react-day-picker), `Form` (react-hook-form context) — compose inside a realistic parent.
- `cssEntry` compiled.css is gitignored → re-sync must recompile it first (see Build setup).
