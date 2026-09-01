# Plan 001: Establish a verification baseline — Vitest, typecheck script, CI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 4286cc9..HEAD -- package.json tsconfig.json src/lib/crm.ts src/lib/whatsapp.ts src/lib/message-templates.ts src/lib/validation/ src/lib/calendar-feed-token.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `4286cc9`, 2026-06-12

## Why this matters

This repo has **zero tests, no typecheck script, and no CI** — there is no one-command way to know the codebase works. Every other plan in `plans/` relies on this one for its verification gates. The pure modules in `src/lib/` (ICS generation feeding the public calendar feed, WhatsApp phone normalization, money-field validation) carry real bug cost and are trivially unit-testable today.

## Current state

- `package.json:5-10` — scripts are only `dev`, `build`, `start`, `lint`. No `test`, no `typecheck`. `typescript` and `eslint` are already devDependencies; **no test runner is installed**.
- `tsconfig.json` — already `"strict": true`, `"noEmit": true`, paths alias `"@/*": ["./src/*"]`. `npx tsc --noEmit` exits 0 at the planned-at commit (verified).
- `npm run lint` exits 0 with **4 pre-existing warnings** (one is `react-hooks/incompatible-library` in `src/components/clients/message-composer.tsx:319`). Warnings are acceptable; do not introduce new ones.
- No `.github/` directory exists.
- This is a Next.js **16.2.6** App Router app (React 19.2.4). The repo's `AGENTS.md` mandates reading the bundled docs before writing Next-specific code. The official testing guidance is at `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` — it recommends Vitest + React Testing Library and notes that **async Server Components are not supported by unit tests** (use E2E for those). This plan only tests pure `src/lib/` modules, so that limitation doesn't bite.

First test targets (all pure, no Next/Supabase imports — verified):

- `src/lib/crm.ts` — stage model + `formatCurrency` (`Intl.NumberFormat`, EUR, `"—"` for null), `clientsPath("buyer") → "/clients/buyers"`, `buyerStageAtLeast`, `stageIndex`.
- `src/lib/whatsapp.ts` — `normalizePhone` (trims, strips leading `"00"`, strips non-digits, requires ≥ 6 digits else `null`), `whatsappLink` (returns `null` for unusable phone; `?text=` URL-encoded), `whatsappGreeting` / `reminderMessage` (language fallback to English).
- `src/lib/message-templates.ts` — `fillTemplate` (replaces `{{var}}`, collapses double spaces, removes empty `()`), `buildVars` (budget string branches: both / min-only / max-only / neither).
- `src/lib/validation/buyer.ts` — `numericString` zod refine (note: zod's `.trim()` runs **before** the refine), `toNumberOrNull`, `emptyToNull`. Excerpt of the refine as it exists today (`src/lib/validation/buyer.ts:10-17`):

  ```ts
  const numericString = (opts?: { int?: boolean }) =>
    z.string().trim().refine(
      (v) =>
        v === "" ||
        ((opts?.int ? Number.isInteger(Number(v)) : !Number.isNaN(Number(v))) &&
          Number(v) >= 0),
      { message: opts?.int ? "Enter a whole number" : "Enter a valid amount" }
    );
  ```

  **Characterize current behavior only.** Do NOT test `"1e999"` / `Infinity` inputs — plan 003 changes that behavior and owns those tests.
- `src/lib/calendar-feed-token.ts` — `feedToken(agentId)` / `verifyFeedToken(token)`: HMAC-SHA256 signed token using `process.env.SUPABASE_SERVICE_ROLE_KEY` as the signing secret. Tests must stub that env var with a dummy string (e.g. `"test-signing-secret"`) — never a real key.

Do **NOT** write tests for `src/lib/ics.ts` in this plan — plan 004 changes its output format (RFC 5545 line folding) and owns its tests.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Install   | `npm install -D <pkgs>`          | exit 0              |
| Typecheck | `npm run typecheck` (added here) | exit 0              |
| Tests     | `npm test`                       | exit 0, all pass    |
| Lint      | `npm run lint`                   | exit 0 (4 pre-existing warnings OK) |
| Build     | `npm run build`                  | exit 0              |

## Suggested executor toolkit

- Read `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` **before** Step 2 — follow its config shape, not memory.

## Scope

**In scope** (the only files you should create/modify):
- `package.json`, `package-lock.json` (scripts + devDependencies)
- `vitest.config.ts` (create)
- `src/lib/crm.test.ts`, `src/lib/whatsapp.test.ts`, `src/lib/message-templates.test.ts`, `src/lib/validation/buyer.test.ts`, `src/lib/calendar-feed-token.test.ts` (create)
- `.github/workflows/ci.yml` (create)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- `src/lib/ics.ts` and any `ics.test.ts` — owned by plan 004.
- Any source file under `src/` other than the new `*.test.ts` files — this plan is purely additive.
- `tsconfig.json` — only touch if Step 2's verify fails because test files aren't picked up (its `include` already covers `**/*.ts`).

## Git workflow

- Branch: `advisor/001-verification-baseline`
- Commit style (match `git log`): conventional prefixes, e.g. `feat: vitest + typecheck + CI baseline` (recent examples: `feat: portal lead capture — paste an inquiry, AI fills the client`, `fix: keep the notification feed bounded at scale`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the `typecheck` script

In `package.json` scripts, add `"typecheck": "tsc --noEmit"` and `"test": "vitest run"` (test will fail until Step 2 — that's fine, verify only typecheck here).

**Verify**: `npm run typecheck` → exit 0, no output errors.

### Step 2: Install Vitest per the bundled Next.js guide

Read `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`, then:

```
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

Create `vitest.config.ts` following the guide's example: `@vitejs/plugin-react` + `vite-tsconfig-paths` plugins, `environment: 'jsdom'`. (`vite-tsconfig-paths` resolves the `@/*` alias; this plan's tests import via relative paths anyway, but future component tests will need it.)

**Verify**: `npx vitest run` → exits 0 with "no test files found" (or equivalent) — config loads without error.

### Step 3: Tests for `crm.ts`, `whatsapp.ts`, `message-templates.ts`

Create the three test files colocated next to their modules (`src/lib/crm.test.ts` etc. — this establishes the repo's colocation convention). Cover at minimum:

- `crm.test.ts`: `formatCurrency(1500000)` contains `"€"` and grouping; `formatCurrency(null)` → `"—"`; `clientsPath("buyer")` → `"/clients/buyers"`, `clientsPath("seller")` → `"/clients/sellers"`; `buyerStageAtLeast("viewing", "qualified")` → true, `("new", "qualified")` → false, unknown stage → false (indexOf -1); `defaultStageForSide` both sides.
- `whatsapp.test.ts`: `normalizePhone("0034 612-345-678")` → `"34612345678"`; `normalizePhone("+34 612 345 678")` → `"34612345678"`; `normalizePhone("123")` → null; `normalizePhone(null)` → null; `whatsappLink(null)` → null; `whatsappLink("+34612345678", "Hola ¿qué tal?")` starts with `https://wa.me/34612345678?text=` and the text is URL-encoded; `reminderMessage("Anna", "German", "", "Mo 1 Jan")` uses the German body and falls back to the localized noun; unknown language falls back to English.
- `message-templates.test.ts`: `fillTemplate("Hi {{first_name}}, ({{budget}})", vars)` with empty budget removes the empty parens and double spaces; unknown key `{{nope}}` → removed (replaced with ""); `buildVars` budget: both min+max → `"…–…"`, only min → `"from …"`, only max → `"up to …"`, neither → `""`; `getTemplate("intro")` returns a template, `getTemplate("missing")` → null.

**Verify**: `npm test` → exit 0, all tests pass (expect ≥ 20 assertions across 3 files).

### Step 4: Tests for `validation/buyer.ts` and `calendar-feed-token.ts`

- `src/lib/validation/buyer.test.ts`: table-test `numericString()` via `preferencesFormSchema.safeParse` (field `budget_min`): `""` passes; `"250000"` passes; `"-1"` fails; `"abc"` fails; `"  "` passes (zod trims before refine — assert the parsed output is `""`); int variant via `bedrooms`: `"3"` passes, `"2.5"` fails. `toNumberOrNull("")` → null, `toNumberOrNull("12.5")` → 12.5, `toNumberOrNull("abc")` → null. `emptyToNull("  ")` → null. **No Infinity/`1e999` cases — plan 003 owns those.**
- `src/lib/calendar-feed-token.test.ts`: use `vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-signing-secret")` in `beforeEach` (and `vi.unstubAllEnvs` after). Round-trip: `verifyFeedToken(feedToken("some-uuid"))` → `"some-uuid"`. Tampered signature (flip last char) → null. Tampered id part (re-encode different id, keep old sig) → null. No dot → null. Empty id → null.

**Verify**: `npm test` → exit 0, all 5 test files pass.

### Step 5: CI workflow

Create `.github/workflows/ci.yml`: trigger on `push` to `main` + `pull_request`; Node 20 (`actions/setup-node@v4` with `cache: npm`); steps: `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. The build step needs placeholder public env vars (the Supabase config module reads them at import time):

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: sb_publishable_placeholder
  NEXT_PUBLIC_SITE_URL: http://localhost:3000
```

These are dummy values, not secrets — do not add any real key to the workflow.

**Verify** locally (CI can't run here): `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_placeholder NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build` → exit 0. If the developer's `.env.local` exists it takes precedence and plain `npm run build` also works.

## Test plan

The new tests ARE the deliverable; see Steps 3–4 for the case lists. Structural pattern: plain `describe`/`it` + `expect` from vitest, no React rendering in this plan.

## Done criteria

- [ ] `npm run typecheck` exits 0
- [ ] `npm test` exits 0; 5 new test files exist and pass
- [ ] `npm run lint` exits 0 with no NEW warnings (baseline: 4)
- [ ] `npm run build` exits 0 (with placeholder env if no `.env.local`)
- [ ] `.github/workflows/ci.yml` exists and references typecheck, lint, test, build
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` does not exist or recommends a materially different setup than this plan assumes.
- `npm run build` fails for a reason other than missing env vars — report the exact error; do not patch source files to make the build pass.
- Any test you write fails because the **module's behavior** differs from the expectations above (e.g. `normalizePhone` doesn't strip `"00"`). That means the code drifted — report the mismatch instead of "fixing" either side.
- Installing vitest forces a major-version change to an existing dependency.

## Maintenance notes

- Plans 002–005 extend this suite; their tests follow the colocation convention established here (`src/lib/<module>.test.ts`).
- Reviewer should scrutinize: that no test asserts on `ics.ts` (004 owns it), and that the workflow contains only placeholder env values.
- Deferred: component/E2E testing (Playwright) — revisit only when a UI regression actually bites; the bundled docs cover it.
