# Plan 008 (design spike): Specify "matching buyers" on a seller's listing (inverse matching)

> **Executor instructions**: This is a **design spike, not a build plan**. The
> deliverable is a short design document with the query design, UI placement,
> and a build-plan outline — you must not modify any source code. Follow the
> steps and STOP where instructed. When done, update the status row for this
> plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4286cc9..HEAD -- src/lib/data/seller.ts src/components/clients/sections/properties-section.tsx src/components/clients/sections/matching-listings-section.tsx src/lib/message-templates.ts`
> Material drift → compare excerpts before proceeding; on a mismatch, STOP and report.

## Status

- **Priority**: P3
- **Effort**: S (the spike; the build it specifies is roughly M — coarse, as direction estimates are)
- **Risk**: LOW (no code changes)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `4286cc9`, 2026-06-12

## Why this matters

Matching exists in exactly one direction today: a **buyer's** detail page lists the agent's seller listings that fit their preferences. The inverse — standing on a **listing** and seeing which buyers it fits — doesn't exist, even though the workflow it powers already does: the built-in `new_matches` message template exists precisely to tell a buyer about a fitting listing, and the composer supports deep-link prefill (`/clients/[id]?compose=new_matches`). When an agent adds a new listing, "who should I call about this?" is the single highest-value question this data model can answer, and today the app makes them answer it by memory.

## Current state (all verified at `4286cc9`)

- **Forward matching**: `getMatchingListings(prefs)` in `src/lib/data/seller.ts:11-54` — fetches the agent's `properties`, joins seller names, and filters in JS:
  - type: `types.length && p.property_type && !types.includes(p.property_type)` → skip (i.e. a property with NULL type matches any preference);
  - budget: skip if `p.price < budget_min` or `> budget_max` (NULL price matches any budget);
  - bedrooms: skip if `p.bedrooms < prefs.bedrooms` (NULLs match);
  - seller must be `is_active`.
  Rendered by `src/components/clients/sections/matching-listings-section.tsx` on the buyer detail page (`src/app/(app)/clients/[id]/page.tsx:99-107,166`), each match linking to `/clients/${sellerId}`.
- **Buyer preferences**: `buyer_preferences` table — `property_types text[]`, `budget_min/max numeric`, `bedrooms int` (`supabase/migrations/20260529120000_init.sql:70-81`). Note: only buyers at stage `qualified`+ have the preferences card (page gating), but any `buyer_preferences` row can exist.
- **Listings UI**: sellers have a `PropertiesSection` (`src/components/clients/sections/properties-section.tsx`, rendered at `clients/[id]/page.tsx:180-185`); properties are cards inside the seller's detail page — **there is no per-property page**, so the inverse surface must live in/on those cards or the seller page.
- **The outreach hook that makes this actionable**: `MESSAGE_TEMPLATES` in `src/lib/message-templates.ts` includes id `new_matches` ("Share properties that fit their criteria", body references `{{budget}}`); the composer auto-opens a template from the `?compose=<id>` query param (`clients/[id]/page.tsx:78,230` — `autoOpenTemplate={compose ?? null}`); the notification bell and Home dashboard already use this deep-link pattern (`?compose=check_in`, `?compose=offer_followup`).
- **Tenancy/perf context**: all queries are RLS-scoped to the agent; tenant data volumes are small (hundreds of clients, not millions). A related cleanup of `getMatchingListings` (SQL-side filtering) was audited as finding F9 and deliberately **not** planned — don't silently absorb it here, but the spike may recommend whether the inverse query should set the SQL-side pattern both directions then share it.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Recon | `grep -rn "getMatchingListings\|new_matches" src/` | the sites listed above |
| Verify no code touched | `git status` | only `docs/design/matching-buyers.md` + `plans/README.md` |

## Scope

**In scope** (the only files you may create/modify):
- `docs/design/matching-buyers.md` (create — the deliverable)
- `plans/README.md` (status row)

**Out of scope**: ALL source code. The build happens via a future plan that this doc specifies.

## Steps

### Step 1: Define the inverse match semantics

Write the buyer-side mirror of the forward rules, resolving the asymmetries explicitly rather than hand-waving:

- A buyer matches a property when: property's type ∈ buyer's `property_types` (decide: what if the buyer's array is empty — forward logic treats empty prefs as "match all"; mirror that and say so); `budget_min <= price <= budget_max` with NULL-permissive semantics matching the forward direction; `property.bedrooms >= buyer.bedrooms` (note the forward rule is property-bedrooms ≥ pref — keep the same inequality viewed from the other side).
- Which buyers are eligible: `is_active = true`, stage not `reserved`? (Recommend: exclude `reserved` — they've bought; include everyone else, and say why `new` buyers without preferences are/aren't shown.)
- Decide ranking + cap for the UI (e.g. closest budget fit first, cap 5 with "+N more").

### Step 2: Design the query

Specify `getMatchingBuyers(property: { property_type, price, bedrooms })` — proposed home: `src/lib/data/buyer.ts` (it owns buyer-side reads). Decide and justify: single SQL-side query on `buyer_preferences` joined to `clients` (`.contains`/`.lte`/`.gte` on the array and numerics + embedded client), vs the existing JS-filter style. Address the NULL-permissive rules' expressibility in PostgREST operators — if a rule can't be expressed SQL-side, say which part stays in JS. Note whether `buyer_preferences` needs any index (it's PK'd by `client_id`; agent-scoped scans use `buyer_preferences_agent_id_idx`).

### Step 3: Design the surface

Decide and sketch (prose + component references): a match count/badge per property card in `PropertiesSection` with an expandable buyer list, vs a "Matching buyers" card on the seller page aggregating across that seller's listings. Each matched buyer links to `/clients/{buyerId}?compose=new_matches`. Define the empty state and whether the count is computed on seller-page render (cost: one query per property or one batched query — prefer batched; show the shape).

### Step 4: Write the doc + build-plan outline

`docs/design/matching-buyers.md`: Semantics (Step 1 decision table, both directions side by side), Query design (Step 2, with the proposed PostgREST call), UI (Step 3), Effort estimate, and a ready-to-promote outline for a future `plans/0NN-matching-buyers.md` (steps + test plan: the matcher is pure enough to unit-test if the predicate is extracted — recommend extracting a shared `matchesPreferences(prefs, property)` used by BOTH directions so the two can never diverge, and name the file it should live in).

**Verify**: file exists; `git status` clean except the two in-scope files.

## Test plan

Not applicable (no code). Quality bar: the semantics table must cover every NULL combination (no "etc."), and each decision names its rejected alternative.

## Done criteria

- [ ] `docs/design/matching-buyers.md` exists with semantics table, query design, UI sketch, build-plan outline
- [ ] The semantics are an explicit mirror of `getMatchingListings` with every asymmetry resolved in writing
- [ ] A shared-predicate recommendation (single source of truth for both directions) is present
- [ ] `git status` shows no source changes
- [ ] `plans/README.md` status row updated

## STOP conditions

- Inverse-matching code already exists anywhere (`grep -rn "MatchingBuyers\|matching_buyers" src/` hits) — report drift instead of re-designing.
- The forward logic in `src/lib/data/seller.ts` no longer matches the excerpted rules — the mirror must be built from live code; re-anchor or report.

## Maintenance notes

- If finding F9 (SQL-side filtering for the forward direction) is ever executed, both directions should land on the shared predicate this spike recommends — note the dependency in the doc.
- The `new_matches` template's `{{property}}` variable is filled from composer context; the doc should state what the deep link pre-fills so the build plan gets it right.
