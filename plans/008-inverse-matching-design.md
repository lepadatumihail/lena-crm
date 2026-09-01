# Design spike 008 — Matching buyers for a seller's listing (inverse matching)

> **Status**: design spike deliverable (no code changed). Read-only investigation
> against the working tree at the time of writing (plans 001–003 landed; the
> forward matcher in `src/lib/data/seller.ts` is unchanged from commit `4286cc9`,
> drift check empty).
>
> **Note on filename**: plan 008 (`plans/008-spike-inverse-matching.md`) names the
> deliverable `docs/design/matching-buyers.md`. The orchestrator running this
> spike directed the doc to `plans/008-inverse-matching-design.md` (this file) to
> sit beside the other spike outputs. The future build plan may move/copy it to
> `docs/design/matching-buyers.md` — content is identical either way; no code
> depends on the path.

---

## 1. Problem framing

Matching is one-directional today. Standing on a **buyer**, the agent sees the
seller listings that fit (`getMatchingListings`, rendered by
`MatchingListingsSection`). Standing on a **listing**, there is no view of which
buyers it fits. Yet the workflow that view powers already exists end to end:

- The built-in `new_matches` message template ("New matching listings — Share
  properties that fit their criteria") lives in
  `src/lib/message-templates.ts:30-37`.
- The composer auto-opens a template from `?compose=<id>`
  (`src/app/(app)/clients/[id]/page.tsx:78,230` → `autoOpenTemplate={compose ?? null}`;
  consumed in `src/components/clients/message-composer.tsx:73-77,86`).
- The notification bell and Home dashboard already deep-link this way
  (`?compose=check_in`, `?compose=offer_followup`).

So when an agent adds a listing, "who do I call about this?" is answerable from
data the app already holds — it just isn't surfaced. This spike specifies the
inverse query, its semantics (as an explicit mirror of the forward rules), the UI
surface, and a build-plan outline. The single most important design decision is
**extract one shared predicate** so the two directions can never silently
diverge.

---

## 2. Semantics — explicit mirror of `getMatchingListings`

### 2.1 The forward rules, as they actually are (verified)

From `src/lib/data/seller.ts:38-54`, a property `p` matches buyer prefs when ALL hold:

| Field | Forward rule (code) | NULL behaviour |
|-------|---------------------|----------------|
| seller active | `seller.is_active` must be true (`:40`) | — (boolean, not null) |
| type | skip if `types.length && p.property_type && !types.includes(p.property_type)` (`:41-42`) | **empty prefs array → match all**; **`p.property_type` NULL → match any preference** |
| budget | if `p.price != null`: skip if `price < budget_min` or `price > budget_max` (`:43-46`) | **`p.price` NULL → matches any budget**; **`budget_min`/`budget_max` NULL → that bound is open** |
| bedrooms | skip if `prefs.bedrooms != null && p.bedrooms != null && p.bedrooms < prefs.bedrooms` (`:47-48`) | **either side NULL → matches** (rule is "property bedrooms ≥ wanted") |

The forward direction is **NULL-permissive everywhere**: a missing value never
excludes. That is the philosophy the inverse must preserve.

### 2.2 The shared predicate (single source of truth)

Both directions are the *same boolean function* of `(prefs, property)`. Define it
once:

```ts
// src/lib/matching.ts  (NEW — pure, no Supabase import, unit-testable)
export type MatchPrefs = {
  property_types: string[];          // [] means "any type"
  budget_min: number | null;
  budget_max: number | null;
  bedrooms: number | null;
};
export type MatchProperty = {
  property_type: string | null;
  price: number | null;
  bedrooms: number | null;
};

export function matchesPreferences(prefs: MatchPrefs, property: MatchProperty): boolean {
  const types = prefs.property_types ?? [];
  // type: empty prefs = any; null property type = matches any pref
  if (types.length && property.property_type && !types.includes(property.property_type))
    return false;
  // budget: null price = any; each null bound is open
  if (property.price != null) {
    if (prefs.budget_min != null && property.price < prefs.budget_min) return false;
    if (prefs.budget_max != null && property.price > prefs.budget_max) return false;
  }
  // bedrooms: either side null = matches; else property must have >= wanted
  if (prefs.bedrooms != null && property.bedrooms != null && property.bedrooms < prefs.bedrooms)
    return false;
  return true;
}
```

This is a byte-for-byte lift of the current inline logic in `seller.ts:41-48` —
extracting it is behaviour-preserving for the forward direction. The inverse
direction calls the **exact same function**; there is no second rule set to keep
in sync. (`bathrooms` and `area_notes` exist on `buyer_preferences` but the
forward matcher ignores them — the inverse must ignore them too, so the
predicate stays identical. Adding them is explicitly out of scope and would be a
both-directions change to this one function.)

### 2.3 The full semantics table (every NULL combination, no "etc.")

Mirror viewed from the listing side. "Match" = `matchesPreferences` returns true.

**Type** (`prefs.property_types` = T, `property.property_type` = pt):

| T | pt | Match? | Why |
|---|----|--------|-----|
| `[]` (empty) | any value | ✅ | empty prefs = "any type" (forward `types.length` guard) |
| `[]` (empty) | NULL | ✅ | empty prefs = any |
| `['villa']` | `'villa'` | ✅ | in the set |
| `['villa']` | `'apartment'` | ❌ | not in the set |
| `['villa']` | NULL | ✅ | NULL type is permissive (forward `p.property_type` guard) |

**Budget** (`property.price` = P, `budget_min` = lo, `budget_max` = hi):

| P | lo | hi | Match? | Why |
|---|----|----|--------|-----|
| NULL | any | any | ✅ | NULL price never excludes (forward `p.price != null` guard) |
| 500k | NULL | NULL | ✅ | no bounds = open |
| 500k | 400k | NULL | ✅ | above (open) min, no max |
| 500k | 600k | NULL | ❌ | below min |
| 500k | NULL | 600k | ✅ | under (open-min) max |
| 500k | NULL | 400k | ❌ | over max |
| 500k | 400k | 600k | ✅ | inside `[lo, hi]` |
| 500k | 400k | 450k | ❌ | over max |
| 500k | 500k | 600k | ✅ | inclusive lower bound (`< lo` excludes, so `==` matches) |
| 500k | 400k | 500k | ✅ | inclusive upper bound (`> hi` excludes, so `==` matches) |

**Bedrooms** (`property.bedrooms` = pb, `prefs.bedrooms` = wb):

| pb | wb | Match? | Why |
|----|----|--------|-----|
| NULL | NULL | ✅ | both NULL = permissive |
| NULL | 3 | ✅ | property bedrooms unknown = permissive |
| 3 | NULL | ✅ | buyer didn't specify = permissive |
| 4 | 3 | ✅ | property has ≥ wanted |
| 3 | 3 | ✅ | equal satisfies `>=` |
| 2 | 3 | ❌ | property has fewer than wanted |

A property matches a buyer iff **all three** blocks return Match.

### 2.4 Which buyers are eligible (the inverse direction's "is_active" mirror)

The forward direction gates on **`seller.is_active`** only (`:40`) — it does not
filter sellers by stage. The inverse must decide the buyer-side gate. Decisions:

- **`clients.side = 'buyer'`** — required (the predicate is meaningless for sellers).
- **`clients.is_active = true`** — direct mirror of the forward `is_active` gate.
- **Stage gate: exclude `reserved`, include everything else.**
  Rationale: a `reserved` buyer has effectively bought — pitching them a new
  listing is noise, and this matches the app's existing "quiet buyer" nudge rule
  which already excludes `stage = 'reserved'` (per plan 009 / `attention.ts`).
  *Rejected alternative*: gate on `qualified`+ (matching the page-level rule that
  only shows the preferences card from `qualified` on,
  `src/app/(app)/clients/[id]/page.tsx` gating). Rejected because the gate that
  matters is **"does a `buyer_preferences` row exist"**, not the stage badge — a
  row can exist for any stage, and if one exists the buyer is a real lead worth
  contacting. Filtering by stage would silently drop valid matches whose stage
  was nudged back to `contacted`. We exclude only the terminal `reserved`.
- **`new` buyers with no preferences row are not shown** — and this needs no
  special rule: the inverse query is rooted in `buyer_preferences` (§3), so a
  buyer without a row simply isn't a candidate. This is the exact mirror of the
  forward direction, which can only run once the buyer *has* a prefs row
  (`getMatchingListings` is only called when `prefs` is non-null,
  `page.tsx:99-107`). A buyer with a prefs row but empty/NULL fields matches
  permissively (correct — that's an under-qualified lead the agent may still want
  to call), but see Risk R3 on the noise this can create.

### 2.5 Ranking + cap

- **Cap: 5 visible, "+N more" affordance** (matches the forward section's
  unbounded list but acknowledges a hot listing could match many buyers; the
  forward direction is naturally bounded by the agent's own listing count, the
  inverse is bounded by the agent's whole buyer book, which is larger).
- **Rank: tightest budget fit first.** Concretely: buyers whose
  `[budget_min, budget_max]` window most snugly contains the price rank above
  those with a very wide or open-ended budget, with `priority` buyers
  (`clients.priority`) tie-broken to the top, then most-recently-updated.
  *Rejected alternative*: rank by recency only — simpler, but buries the buyer
  whose budget is a bullseye under buyers who merely have a wide net. A coarse
  scoring (e.g. distance of `price` from the window's nearest bound, NULL bounds
  treated as "wide") is enough; this is a UI nicety, not a correctness concern,
  and can be computed in JS post-fetch (§3.3) where the predicate already runs.

---

## 3. Query design — `getMatchingBuyers`

### 3.1 Signature and home

```ts
// src/lib/data/buyer.ts  (it owns buyer-side reads)
export type BuyerMatch = {
  client: { id: string; first_name: string; last_name: string; priority: boolean };
  prefs: BuyerPreferences;
};

export async function getMatchingBuyers(property: {
  property_type: string | null;
  price: number | null;
  bedrooms: number | null;
}): Promise<BuyerMatch[]>
```

### 3.2 SQL-side vs JS-side — recommendation and the hard part

**Recommendation: a hybrid that mirrors the forward style — fetch agent-scoped
candidate rows in one round-trip, then apply `matchesPreferences` in JS.** Push
down only the *cheap, unambiguous* filters; keep the NULL-permissive logic in JS
because PostgREST cannot express it cleanly.

Why not push everything to SQL: the rules are **NULL-permissive**, and that
inverts every comparison's NULL semantics relative to plain SQL operators.

- **Type**: forward rule = "pref array empty OR property type NULL OR property
  type ∈ array". PostgREST `.contains`/`.cs` (array-contains) and `.ov`
  (overlap) test array membership, but cannot natively express *"OR the array is
  empty OR the scalar is NULL still matches"*. You'd need an `.or(...)` filter
  string combining `property_types.cs.{<type>}`, `property_types.eq.{}`, plus the
  null-type branch — brittle, and array-literal escaping inside an `.or()` string
  is error-prone. Keep in JS.
- **Budget**: forward rule treats **NULL price as match-all** and **each NULL
  bound as open**. SQL `budget_min <= price` is NULL-propagating: a row with
  `budget_min IS NULL` yields NULL (not true), so a naive `.lte`/`.gte` would
  *drop* permissive rows — the opposite of the intent. Correct SQL needs
  `(budget_min is null or budget_min <= P)` per bound; expressible via `.or()`
  but verbose and easy to get backwards. Keep in JS.
- **Bedrooms**: same NULL-permissive trap. Keep in JS.

What CAN be pushed down safely (narrows the scan, no NULL hazard):

- `side` is `'buyer'` — but note candidates come from `buyer_preferences`, which
  is buyer-only by construction, so this is implicit.
- `is_active = true` and `stage != 'reserved'` — on the joined `clients` row.
- agent scope — automatic via RLS (`agent_id = auth.uid()`), no explicit filter.

**Two viable shapes:**

**(A) Embedded select from `buyer_preferences` (one round-trip):**

```ts
const { data, error } = await supabase
  .from("buyer_preferences")
  .select(
    "client_id, property_types, budget_min, budget_max, bedrooms," +
    " client:clients!inner(id, first_name, last_name, is_active, stage, priority, side)"
  )
  .eq("client.is_active", true)
  .neq("client.stage", "reserved")
  .eq("client.side", "buyer");
// then: data.filter(row => matchesPreferences(row, property)) and map to BuyerMatch
```

The FK `buyer_preferences.client_id → clients.id` exists in the migration
(`init.sql:71`), so PostgREST embedding works at the DB level. **Caveat (real
finding):** the hand-written `src/lib/supabase/types.ts` has
`buyer_preferences.Relationships: []` (empty) — so the embed is **not typed** and
would need a local cast/typed wrapper, or the types file regenerated
(`npx supabase gen types`, out of scope for the build plan to do as a drive-by).
The forward direction sidestepped exactly this by doing two queries.

**(B) Two queries (mirror the forward style):** fetch `buyer_preferences` for the
agent (RLS-scoped), collect `client_id`s, fetch matching `clients` with the
active/stage/side gate, build a `Map`, JS-filter with `matchesPreferences`. This
is the **direct structural mirror** of `getMatchingListings`
(`seller.ts:19-34`), needs no embed typing, and reads identically to existing
code.

**Recommendation: shape (B)** for v1 — it matches the forward direction's
already-reviewed pattern exactly (the whole point of this spike is symmetry), it
avoids the untyped-embed wrinkle, and at this product's data volumes (hundreds of
clients per agent, §F9 context) the extra round-trip is free. Revisit shape (A)
only if/when F9 ("SQL-side filtering for the forward direction") is executed —
**if F9 lands, both directions should move together** (see §6).

### 3.3 Putting it together

```ts
export async function getMatchingBuyers(property: {
  property_type: string | null; price: number | null; bedrooms: number | null;
}): Promise<BuyerMatch[]> {
  const supabase = await createSupabase();
  const { data: prefs, error } = await supabase
    .from("buyer_preferences")
    .select("client_id, property_types, budget_min, budget_max, bedrooms");
  if (error) throw new Error(error.message);
  const rows = prefs ?? [];
  if (rows.length === 0) return [];

  const clientIds = [...new Set(rows.map((r) => r.client_id))];
  const { data: clients, error: cErr } = await supabase
    .from("clients")
    .select("id, first_name, last_name, is_active, stage, side, priority")
    .in("id", clientIds);
  if (cErr) throw new Error(cErr.message);

  const byId = new Map((clients ?? []).map((c) => [c.id, c]));
  const matches: BuyerMatch[] = [];
  for (const r of rows) {
    const c = byId.get(r.client_id);
    if (!c || c.side !== "buyer" || !c.is_active || c.stage === "reserved") continue;
    if (!matchesPreferences(r, property)) continue;
    matches.push({ client: { id: c.id, first_name: c.first_name, last_name: c.last_name, priority: c.priority }, prefs: r });
  }
  return rankByBudgetFit(matches, property.price); // §2.5, pure JS
}
```

### 3.4 Indexes

No new index needed. `buyer_preferences` is PK'd by `client_id` and has
`buyer_preferences_agent_id_idx` (`init.sql:82`); the agent-scoped scan RLS adds
is index-backed. `clients` `.in("id", …)` hits the PK. Data volumes are
tenant-bounded and small — this is the same cost profile the team already
accepted for the forward matcher (F9, audited and deliberately not optimized).

---

## 4. UI surface

### 4.1 Decision: one aggregated "Matching buyers" card on the seller page

There is **no per-property page** — properties are cards inside
`PropertiesSection` on the seller's detail page (`page.tsx:180-185`). Two options:

- **Per-card badge + expandable buyer list** (a count on each `PropertyCard`,
  `properties-section.tsx:103-199`). Pro: pinpoints which listing each buyer
  fits. Con: N independent buyer lists on one page; visually heavy; a buyer who
  fits several of the seller's listings appears repeatedly; the card component is
  a `"use client"` form shell that we'd have to thread match data into.
- **One "Matching buyers" card on the seller page** that aggregates across that
  seller's listings (dedup buyers, annotate which listing(s) they fit). Pro:
  mirrors the forward `MatchingListingsSection` (one card, one list) almost
  exactly; one place for the empty state; naturally deduped; rendered as a server
  component fed by data computed in `page.tsx` like `matches` already is.

**Recommendation: the aggregated card** — `MatchingBuyersSection`, a near-twin of
`MatchingListingsSection` (`matching-listings-section.tsx`), rendered on the
seller branch of the page right after `PropertiesSection`. *Rejected*: per-card
badges — revisit only if/when a per-property page ever exists. (If the agent
wants per-listing granularity, each matched buyer row can show a small "fits: 2
listings" / property-title hint, computed from the aggregation.)

### 4.2 Shape and behaviour

- Title: `Matching buyers (N)` — exact mirror of `Matching listings (N)`.
- Each row: buyer name, their budget window (reuse `formatCurrency`), bedrooms
  wanted, and a `priority` marker; links to
  **`/clients/{buyerId}?compose=new_matches`**. (Forward rows link to
  `/clients/{sellerId}` with no compose param; the inverse intentionally adds the
  deep link because the *action* on a matched buyer is "message them about this".)
- Cap 5, then "+N more" (§2.5).
- **Empty state**: `No active buyers match this seller's listings yet.` — mirror
  of the forward copy in `matching-listings-section.tsx:31-34`. A second empty
  case worth distinguishing: seller has **no listings at all** → don't render the
  card (or render "Add a listing to see matching buyers"), parallel to how the
  forward card only renders when the buyer has a prefs row (`page.tsx:166`).

### 4.3 The deep-link prefill (so the build plan gets it right)

`?compose=new_matches` opens the composer pre-filled with the `new_matches`
template (`message-composer.tsx:73-77,86`). Its body references `{{budget}}`,
filled from the **target buyer's** preferences via `buildVars`
(`message-templates.ts:101-124`) using `prefs.budget_min/max` —
**this already works**: the destination is the buyer's own detail page, whose
`page.tsx:109-116` builds `messageVars` from that buyer's prefs. So the link
needs no extra params; landing on the buyer page with `compose=new_matches` is
sufficient and the budget interpolates correctly. The template's `{{property}}`
variable is *not* pre-filled by this link (it's chosen in the composer's Property
dropdown, sourced from the buyer's viewings, `page.tsx:118-122`); that's
acceptable for v1 — the agent picks which listing to pitch. A future enhancement
could pass the seller's property label through, but that needs a new query param
the composer doesn't read today (flag, don't build).

### 4.4 Render cost

Computed once on seller-page render, like `matches` is for buyers
(`page.tsx:99-107`). The aggregation runs **one** `getMatchingBuyers` call **per
property**, then dedups in JS. Prefer a **single batched call**: pass the
seller's whole property set and fetch buyer candidates once, scoring each buyer
against every property in JS (the predicate is cheap):

```ts
// batched variant fetches buyer_preferences + clients ONCE, then for each buyer
// records which of the seller's properties it matches.
getMatchingBuyersForListings(properties: MatchProperty[]): Promise<BuyerMatch[]>
```

This is one extra `Promise.all` entry in `page.tsx`'s existing fetch block,
gated on `showProperties && properties.length > 0`. Two queries total regardless
of listing count — strictly better than per-card.

---

## 5. Effort estimate & build-plan outline

**Effort: M** (small-M). Pure-predicate extraction + one data fn + one server
component + one page wiring + tests. No schema, no migration, no deps.

Ready-to-promote outline for a future `plans/0NN-matching-buyers.md`:

- **Step 1 — Extract the shared predicate.** Create `src/lib/matching.ts` with
  `matchesPreferences` (§2.2). Refactor `getMatchingListings`
  (`seller.ts:38-54`) to call it — behaviour-preserving. This is the
  single-source-of-truth move; do it first so both directions share it from day
  one.
- **Step 2 — Inverse query.** Add `getMatchingBuyers` /
  `getMatchingBuyersForListings` to `src/lib/data/buyer.ts` (§3.3, §4.4), reusing
  the predicate. Shape (B), two queries.
- **Step 3 — UI.** Add `MatchingBuyersSection`
  (`src/components/clients/sections/matching-buyers-section.tsx`), twin of
  `matching-listings-section.tsx`; rows link to
  `/clients/{buyerId}?compose=new_matches`. Wire into the seller branch of
  `src/app/(app)/clients/[id]/page.tsx` (add to the `Promise.all`, render after
  `PropertiesSection`, gate on `showProperties && properties.length > 0`).
- **Step 4 — Tests.** New `src/lib/matching.test.ts` (Vitest, per plan 001's
  harness) covering **every row of §2.3's three tables** plus the
  `reserved`/inactive/`side` exclusions — the predicate is pure, so this is the
  bulk of the safety net and protects BOTH directions. Optionally a data-layer
  test for the exclusion gates with a mocked Supabase client.

**Test plan**: the §2.3 tables ARE the test matrix — one assertion per row, both
"property fits buyer" and "buyer fits property" framings exercising the same
function. Add the two new asymmetry cases the inverse introduces (the `reserved`
exclusion; the "no listings → no card" empty state).

---

## 6. Risks, dependencies, cross-references

- **R1 — Divergence (the core risk this spike exists to kill).** If the inverse
  re-implements the rules instead of sharing the predicate, the two drift the
  moment someone tweaks one. **Mitigation: §2.2 shared `src/lib/matching.ts`,
  extracted in Step 1 before the inverse is written.** This is the doc's central
  recommendation (Done criteria of the plan).
- **R2 — F9 coupling.** If finding F9 (SQL-side filtering for the forward
  direction) is ever executed, it MUST adopt this shared predicate, and at that
  point both directions should move to the SQL-side shape (A) **together** — do
  not let one direction go SQL-side while the other stays JS, or the NULL-
  permissive semantics will diverge in exactly the subtle way R1 warns about.
  The plans/README F9 note already flags "execute them together if picked up."
- **R3 — Permissive-match noise.** A buyer with a prefs row but empty type
  array, NULL budget and NULL bedrooms matches *every* listing. That's faithful
  to the forward semantics, but a popular listing could surface many such under-
  qualified buyers. The cap + budget-fit ranking (§2.5) pushes the snug-budget
  buyers to the top; the wide-open ones fall below the "+N more" fold. Acceptable
  for v1; flag for the maintainer.
- **R4 — Untyped embed** (if shape A is ever chosen): `buyer_preferences`
  Relationships are empty in the hand-written types
  (`src/lib/supabase/types.ts`), so an embedded `clients(...)` select isn't typed
  without regenerating types. Shape (B) avoids this entirely — another reason it
  wins for v1.

**Cross-references (sibling spikes 007 & 009).** This surface's only side effect
is opening the composer to message a buyer — i.e. it *originates outreach*.

- **Plan 009 (outreach tracking):** firing the composer from a matched-buyer row
  is a **contact event**. When 009's `markContacted` write paths land
  (`message-composer.tsx` send actions, per 009 §2), outreach launched from a
  `?compose=new_matches` deep link is recorded exactly like any other composer
  send — no special-casing needed here, because the inverse UI links *to* the
  buyer page and reuses the existing composer. The doc for 009 should treat
  matched-buyer outreach as just another composer send; this doc need add nothing
  to 009's write paths.
- **Plan 007 (email automation):** if a matched buyer is messaged via the
  email channel and 007's real-send pipeline is later built, **that send is the
  same contact event** 009 records (007 and 009 are explicitly required to stay
  compatible — a real email send is a contact event). Inverse matching is purely
  a *discovery* surface upstream of all of this; it introduces no new send path,
  so it stays compatible with both by construction.

---

## 7. Recommendation

**GO** — but as a single bundled build that **extracts the shared predicate
first** (Step 1), non-negotiably. The feature answers the highest-value question
the data model can answer ("who do I call about this listing?"), reuses the
entire existing outreach machinery (`new_matches` template + `?compose` deep
link) with zero new send paths, needs no schema or dependency changes, and is M
effort. The one real risk (rule divergence) is eliminated by the shared-predicate
refactor, which also pays down the inline duplication in the forward matcher.
Defer per-property-card granularity and `{{property}}` deep-link prefill to a
later iteration (both noted as flagged, not built).
