# Plan 006: Document the AI env vars, fix README drift, expand AGENTS.md, drop dead deps

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 4286cc9..HEAD -- .env.example README.md AGENTS.md package.json .gitignore`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: none (docs + dead-dep removal)
- **Depends on**: none (independent; if plan 001 landed, mention `npm run typecheck` / `npm test` in AGENTS.md — see Step 3)
- **Category**: dx / docs
- **Planned at**: commit `4286cc9`, 2026-06-12

## Why this matters

A developer following the README to the letter gets a working app whose two AI features (lead paste, message composer) throw 500s — `OPENROUTER_API_KEY` is read by the code but documented nowhere. The README's design-system section points to a `DESIGN.md` that doesn't exist in the repo. `AGENTS.md` (the operating manual for AI agents in this repo) contains only a Next.js version warning — no commands, no layout, no conventions. And four `@radix-ui` packages are installed but imported nowhere.

## Current state

- `src/lib/openrouter.ts:14` reads `process.env.OPENROUTER_API_KEY` (throws when absent — reached from `src/lib/actions/leads.ts` and `src/lib/actions/messages.ts`); `:25` reads `process.env.OPENROUTER_MODEL` (optional, defaults to `"openai/gpt-4o-mini"`). Neither appears in `.env.example` or `README.md`. These are the only undocumented env vars: the full set read under `src/` is `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, plus `NODE_ENV` checks.
- `.env.example` ends with a `--- Deferred (email automation) ---` section (`# RESEND_API_KEY=`). Keep that section last.
- `README.md:62-71` ("Design system") instructs `npx getdesign@latest add claude`, says it "writes `DESIGN.md` to the repo root", and that globals.css "should be reconciled against it". No `DESIGN.md` exists; `.gitignore` doesn't mention it.
- `AGENTS.md` (entire file):

  ```markdown
  # This is NOT the Next.js you know

  This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
  ```

  `CLAUDE.md` is just `@AGENTS.md`. Keep both that way (CLAUDE.md unchanged).
- `package.json` declares `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`. Verified zero imports: `grep -rn "react-avatar\|react-checkbox\|react-dropdown-menu\|react-tabs" src/` → no matches, and `src/components/ui/` has no corresponding component files.
- Repo facts for the AGENTS.md content: Next.js 16.2.6 App Router, React 19.2.4, TS strict; Supabase with RLS (`agent_id = auth.uid()` on every table); layout — `src/lib/actions/` = `"use server"` mutations returning `{ error: string | null }` with zod `safeParse` (schemas in `src/lib/validation/`), `src/lib/data/` = server-side reads that throw on error, `src/components/ui/` = shadcn-style primitives, `@/*` → `./src/*`; migrations in `supabase/migrations/`; commands `npm run dev|build|lint` (+ `typecheck`/`test` if plan 001 landed).

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npx tsc --noEmit` (or `npm run typecheck` if it exists) | exit 0 |
| Lint      | `npm run lint`      | exit 0 (4 pre-existing warnings OK) |
| Build     | `npm run build`     | exit 0 |
| Dep check | `grep -rn "react-avatar\|react-checkbox\|react-dropdown-menu\|react-tabs" src/` | no matches |

## Scope

**In scope** (the only files you should modify):
- `.env.example`, `README.md`, `AGENTS.md`, `.gitignore`
- `package.json`, `package-lock.json` (via `npm uninstall` only)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- `CLAUDE.md` — stays as the one-line `@AGENTS.md` import.
- Any file under `src/` — this plan is documentation + manifest only.
- Other dependencies, even if `npm outdated` tempts you — version bumps are not in this plan.

## Git workflow

- Branch: `advisor/006-docs-env-hygiene`
- Commit style: `docs: env vars for AI features + agent manual; chore: drop unused radix deps` (one or two commits)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: `.env.example` + README env block

Append to `.env.example` (above the Deferred section), matching its comment style:

```
# OpenRouter — powers the AI features (lead paste, message composer).
# Get a key at https://openrouter.ai/keys. Without it those features
# return an error; everything else works.
OPENROUTER_API_KEY=
# Optional: override the chat model (default: openai/gpt-4o-mini)
# OPENROUTER_MODEL=
```

In `README.md` step 2's env code block, add `OPENROUTER_API_KEY=sk-or-...` with the same one-line comment treatment as the existing rows.

**Verify**: `grep -c "OPENROUTER" .env.example README.md` → ≥ 2 and ≥ 1 respectively.

### Step 2: Fix the Design-system section + gitignore

Rewrite `README.md`'s "Design system" section to state reality: the Tailwind v4 theme lives in `src/app/globals.css`; `npx getdesign@latest add claude` can regenerate the `DESIGN.md` spec locally for reference, and the file is intentionally not committed. Add `DESIGN.md` to `.gitignore` under the "local tooling / editor" group.

**Verify**: `grep -n "DESIGN.md" .gitignore` → 1 match.

### Step 3: Expand `AGENTS.md`

Keep the existing Next.js warning as section 1, verbatim. Add (target ≤ 60 lines total, dense):

- **Verify your work**: the commands table — `npm run lint`, `npx tsc --noEmit` (or `npm run typecheck`/`npm test` if those scripts exist in package.json at execution time — check first), `npm run build`.
- **Layout map**: the 6–8 bullets from Current state (actions/data/validation/ui/migrations/proxy.ts, `@/*` alias).
- **Conventions**: server-action shape (zod `safeParse` → RLS-scoped client → `{ error }` → `revalidatePath`; exemplar `src/lib/actions/buyer.ts`); data modules throw; tenancy = RLS keyed to `agent_id = auth.uid()` — never use `src/lib/supabase/admin.ts` outside the calendar feed route.
- **Env**: pointer to `.env.example`; note `OPENROUTER_API_KEY` is needed for AI features.

**Verify**: `wc -l AGENTS.md` → ≤ 70; the original warning text still present (`grep -c "NOT the Next.js" AGENTS.md` → 1).

### Step 4: Remove the four unused deps

First re-confirm: `grep -rn "react-avatar\|react-checkbox\|react-dropdown-menu\|react-tabs" src/` → no matches. Then:

```
npm uninstall @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dropdown-menu @radix-ui/react-tabs
```

**Verify**: `npm run build` → exit 0 (with `.env.local` present, or the placeholder env vars from plan 001's Step 5); `npm run lint` → exit 0.

## Test plan

No unit tests (docs + manifest). The build in Step 4 is the regression gate. If plan 001 landed, also run `npm test` → exit 0.

## Done criteria

- [ ] `.env.example` and README document `OPENROUTER_API_KEY` (+ optional `OPENROUTER_MODEL`)
- [ ] README design-system section no longer implies `DESIGN.md` is committed; `.gitignore` covers it
- [ ] `AGENTS.md` contains commands, layout map, conventions, env pointer — and the original Next 16 warning
- [ ] The four `@radix-ui` packages are gone from `package.json` and `package-lock.json`
- [ ] `npm run build` exits 0; `npm run lint` exits 0 with no new warnings
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The grep in Step 4 finds any import of those packages (drift — someone started using one); skip the uninstall for that package and report.
- `npm uninstall` cascades into other dependency version changes in the lockfile beyond removing the four packages and their now-orphaned transitive deps.
- A `DESIGN.md` now exists in the repo root (drift) — Step 2's rewrite would then be wrong; report instead.

## Maintenance notes

- AGENTS.md should be updated when plan 001 lands (add `npm run typecheck` / `npm test`) — if 001 already landed, write the final command list now and say so in your report.
- Reviewer: check the AGENTS.md additions against the actual code once more — a wrong "manual" is worse than a thin one.
- Deferred: a `CONTRIBUTING.md` — single-maintainer repo, not worth it now.
