# Lena — Invite Code + Referral System Spec

*Grounded in the existing codebase: Supabase + Next.js 16 (App Router) + server actions, RLS `agent_id = auth.uid()`, hand-written `src/lib/supabase/types.ts`, service-role admin client at `src/lib/supabase/admin.ts`, passwordless auth (Google OAuth + email OTP) via `src/app/auth/callback/route.ts`.*

**Founder decisions baked in (2026-06-25):** Billing = **Stripe + Stripe Tax** · Cohort = **first 20 *paying* founders, then close publicly** · **Open signup allowed at €29 standard** (invite is NOT an access gate) · Trial = **7 days, then HARD paywall** ("upgrade to keep your leads") · **Annual billing at launch** (€190 founding / €290 standard) · Status = **refining spec, not building yet**.

> **⚠️ Superseded in part on 2026-09-06 — Free + Pro model.** The trial, the hard paywall, the four prices and the "no free tier" stance below are replaced by: a **Free tier capped at 3 clients** (every row, incl. inactive), **Pro at €29/mo or €276/yr + IVA**, **Founding = first 20 paying agents lock €19/mo or €180/yr for life** (public — anyone, with a spots-left counter on the pricing page; invites become plain referral links, one permanent link per agent), **no time trial**, **nothing deleted on cancel** (only *adding* a client is blocked over the cap), referral reward unchanged (2nd paid invoice, both sides), referrers without a subscription get **a comped Pro month from the backend** (`pro_until`), subscribers get a balance credit worth one month of their plan. Decision record + change list: `plans/free-pro-pricing.md`. Sections marked *(superseded)* are kept for history.

---

## 0. The model (read this first — it changed)

Because signup is **open at €29 standard**, the invite code is **not** an access gate. It's a **token that does two things**:

1. **Grants Founding status** — €19/mo locked for life + "Founding Agent #N" badge — *if the founding cohort is still open* (< 20 paying founders).
2. **Records the referral** — links inviter → invitee so the free-month reward can fire.

So there are two doors into Lena:

| Door | Who | Price | Status | Gets invite codes? |
|---|---|---|---|---|
| **Open signup** (`/login` → `/onboarding`) | Anyone | €29/mo standard | — | No (during launch) |
| **Invited** (`/join/[code]`) | Warm contacts + their co-brokers | **€19/mo locked for life** (while cohort open) | **Founding Agent #N** | **Yes — 3 codes** |

**The exclusivity lives in the Founding *tier*, not in access.** "Founding Agents of the Costa del Sol" is the curated club (capped, badged, price-locked, code-bearing); standard signups are welcome but don't get the status, the price, or the codes. This keeps the "by invitation" story honest *and* removes the curation bottleneck — you never have to manually approve a stranger.

**Referral reward is an ongoing mechanic, independent of founding status.** Even after the cohort closes, an invite code still records a referral and still pays both sides a free month. Founding status is the *launch-phase bonus* layered on top of invites for the first 20.

> **One primitive does the payouts:** "free month" = a **€19 credit applied to the next invoice** (Stripe customer balance transaction). The same primitive comps a design partner. *(2026-09-06: a Free tier capped at 3 clients now exists and founding is public — see the note at the top. Invites are plain referral links; a Free referrer's reward is a comped Pro month, a subscriber's is a balance credit.)*

---

## 1. Dependencies to add first

| Dependency | Why | Plan |
|---|---|---|
| **`profiles` table** | Agents are just `auth.users` today. Need per-agent cohort / founding number / admin flag / invite quota / Stripe mirror. | Build it (§2). Auto-created on signup via an `auth.users` trigger (open signup ⇒ every user gets one). |
| **Stripe + Stripe Tax** | No billing exists. Rewards = invoice credits; open signup needs self-serve checkout. | §6. Two prices (founding €19, standard €29), no-card trials, balance-transaction credits, webhooks. |
| **Access gate + hard paywall** | Middleware only checks auth today. Now access is computed from `subscription_status` + `trial_ends_at`; expired trial → hard paywall at `/upgrade`. | Extend `src/lib/supabase/middleware.ts` / the `(app)` layout (§3-F). |

---

## 2. Data model (`supabase/migrations/20260625120000_invites_referrals.sql`)

Follows existing conventions (enums in `public`, `set_updated_at()` trigger, RLS `for all to authenticated`).

```sql
-- ---------- Enums ----------
create type public.cohort as enum ('founding', 'standard');
create type public.invite_status as enum ('active', 'redeemed', 'revoked', 'expired');
create type public.referral_status as enum ('pending', 'qualified', 'rewarded', 'void');
create type public.sub_status as enum ('none', 'trialing', 'active', 'past_due', 'canceled');

-- ---------- founding number allocator ----------
create sequence public.founding_number_seq;   -- only advanced for *paying* founders, capped at 20

-- ============================================================
-- profiles — one row per agent (= auth.uid()).
-- Auto-created on signup (trigger below). Default = standard.
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,  -- = agent_id
  email text,
  full_name text,
  is_admin boolean not null default false,             -- the founder
  cohort public.cohort not null default 'standard',
  founding_intent boolean not null default false,      -- invited & claimed, not yet paid
  founding_number integer,                             -- "Founding Agent #N", set at first payment
  invite_quota integer not null default 0,             -- 3 once they're a founder; 0 for standard
  referred_by uuid references auth.users (id) on delete set null,
  stripe_customer_id text,
  subscription_status public.sub_status not null default 'none', -- THE "status" that gates access
  trial_ends_at timestamptz,                           -- set to now()+7d at signup; drives the paywall
  price_locked_eur numeric,                            -- 19 for founders
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create a profile when a user signs up (open signup ⇒ everyone gets one)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, subscription_status, trial_ends_at)
  values (new.id, new.email, 'trialing', now() + interval '7 days')  -- 7-day trial starts at signup
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- invites — codes a founder hands to co-brokers
-- ============================================================
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                           -- Crockford base32, 7 chars, e.g. "MAR7K2Q"
  inviter_id uuid references auth.users (id) on delete set null,  -- null = founder seed
  note text,                                           -- "for María @ E&V"
  status public.invite_status not null default 'active',
  redeemed_by uuid references auth.users (id) on delete set null,
  redeemed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);
create index invites_inviter_idx on public.invites (inviter_id);

-- ============================================================
-- referrals — inviter→invitee relationship + reward state
-- ============================================================
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invitee_id uuid not null references auth.users (id) on delete cascade,
  invite_id uuid references public.invites (id) on delete set null,
  status public.referral_status not null default 'pending',
  paid_invoice_count integer not null default 0,       -- drives qualification (>=2 = sustained)
  qualified_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (invitee_id)                                  -- an agent can be referred once
);
create index referrals_inviter_idx on public.referrals (inviter_id);

-- ============================================================
-- referral_credits — ledger of free-month credits (the payout primitive)
-- ============================================================
create table public.referral_credits (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users (id) on delete cascade,
  amount_eur numeric not null,                         -- 19.00 = one month
  reason text not null,                                -- 'referral_inviter' | 'referral_invitee' | 'manual_comp'
  referral_id uuid references public.referrals (id) on delete set null,
  applied_to_stripe boolean not null default false,
  stripe_balance_txn_id text,
  created_at timestamptz not null default now()
);
create index referral_credits_agent_idx on public.referral_credits (agent_id);
create index referral_credits_unapplied_idx
  on public.referral_credits (agent_id) where not applied_to_stripe;
```

> **Dropped from the previous draft:** `access_requests` table and `/request-access` route — unnecessary now that signup is open.

### RLS (read-own; all mutations via the service-role admin client)

These tables involve **cross-agent** relationships and **privilege fields** (`is_admin`, `cohort`, `founding_number`, credits), so authenticated users get **SELECT-only** policies on their own rows; every write goes through a validating server action using `createAdminClient()`. An agent therefore cannot mint codes, self-assign founding status, or forge credits.

```sql
alter table public.profiles          enable row level security;
alter table public.invites           enable row level security;
alter table public.referrals         enable row level security;
alter table public.referral_credits  enable row level security;

create policy "read own profile"  on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "read own invites"  on public.invites
  for select to authenticated using (inviter_id = (select auth.uid()));
create policy "read own referrals" on public.referrals
  for select to authenticated using (inviter_id = (select auth.uid()));
create policy "read own credits"  on public.referral_credits
  for select to authenticated using (agent_id = (select auth.uid()));
-- No INSERT/UPDATE/DELETE policies for authenticated ⇒ denied unless service-role.
```

---

## 3. Flows

### A. Founder seeds the first codes
Admin-only server action `mintInvite({ note, inviterId? })` → unique Crockford-base32 code (collision-retry on the `unique` constraint), `invites` row, 30-day expiry. Founder shares `https://app.lena/join/MAR7K2Q` over WhatsApp. At MVP this can be a Supabase Studio insert; the action is Phase-1 polish.

### B. Signing up

**Open (no code):** normal `/login` (Google/OTP) → trigger creates a `standard` profile → `/onboarding` starts a €29 Stripe trial. Done. No founder involvement.

**Invited (`/join/[code]`):**
1. `/join/[code]` (server component) validates the code via admin client (`active`, not expired). Invalid → friendly "expired invite, you can still join at standard" page that links to open signup. Valid → "**{inviterName} invited you to the founding circle**" + sign-in CTA. Before auth, set a **signed httpOnly cookie** `lena_invite=code` (`sameSite=lax`, `maxAge=30m`) — this survives the OAuth round-trip.
2. Agent completes Google/OTP (unchanged). Profile auto-created by the trigger (standard, by default).
3. **`src/app/auth/callback/route.ts`** — after `exchangeCodeForSession`, if a valid `lena_invite` cookie is present, call RPC **`claim_founding_invite(code, user_id)`** (idempotent), then clear the cookie and redirect to `/onboarding`.

`claim_founding_invite(code, user_id)` — one `security definer` transaction:
```
- lock invite row where code, status='active', not expired   (else return 'invalid')
- if invite.inviter_id = user_id                              → return 'self_referral' (reject)
- if profile.cohort = 'founding' OR referral already exists   → return 'already_claimed' (idempotent no-op)
- mark invite redeemed (status='redeemed', redeemed_by, redeemed_at)   -- guards double-spend
- update profile: founding_intent=true, price_locked_eur=19, cohort stays 'standard' until paid
- insert referral { inviter_id, invitee_id=user_id, invite_id, status='pending' }
- set profile.referred_by = invite.inviter_id
```
Founding *number* and `cohort='founding'` are **not** set here — they're allocated at first payment (§3-C), so the cap counts only paying founders. `founding_intent=true` is what makes `/onboarding` show the €19 price + "your Founding spot is reserved."

### C. Trial (7 days, DB-only) → paid (Stripe), and founding allocation *(superseded 2026-09-06: no trial — signup lands on Free; founding allocation at first payment unchanged)*
- **Trial starts at signup** as a pure DB flag — the `handle_new_user` trigger sets `subscription_status='trialing'`, `trial_ends_at = now()+7d`. **No Stripe call at signup**; full app access for 7 days.
- `/onboarding` is *product* onboarding (concierge for founders), **not** a payment step.
- **Conversion happens at the paywall** (§3-F) or whenever the agent clicks "Upgrade": Stripe Checkout (subscription mode, **card required, no Stripe trial** — the 7-day window already elapsed in-app), `automatic_tax` on. Price chosen by `(founding_intent ? founding : standard) × (monthly | annual)` → one of **4 price IDs**.
- Webhook **`checkout.session.completed`** → set `stripe_customer_id`, `subscription_status='active'`.
- Webhook **`invoice.paid`** (first payment): if `founding_intent` and **fewer than 20 founders allocated**, run `allocate_founding_number(user_id)`:
  ```
  if (select count(*) from profiles where founding_number is not null) < 20:
      update profile set cohort='founding', founding_number = nextval('founding_number_seq'),
                         invite_quota = 3
      mintInvite ×3 for this agent       -- their codes appear on the Invites page
  else:
      -- cohort filled while they trialed → founder judgment (default: honor €19 for
      -- anyone invited & trialing before close; otherwise drop to standard €29)
  ```
  This is the "**first 20 paying founders, then close publicly**" rule, enforced atomically at payment.

### D. Referral qualification + reward (Stripe)
Driven by **`invoice.paid`** for the *invitee*:
```
ref = referrals where invitee_id = X and status='pending'
ref.paid_invoice_count += 1
if ref.paid_invoice_count >= 2:                 -- renewed once = "sustained payer"
    ref.status='qualified'; qualified_at=now()
    insert referral_credits (inviter, 19, 'referral_inviter', ref.id)
    insert referral_credits (invitee, 19, 'referral_invitee', ref.id)
    ref.status='rewarded'; rewarded_at=now()
```
A **credit applier** (inline in the webhook, or a cron over `referral_credits where not applied_to_stripe`) calls `stripe.customers.createBalanceTransaction(stripe_customer_id, { amount: -1900, currency: 'eur' })` for each agent → their **next invoice drops by €19 = one free month**. Sets `applied_to_stripe=true`, stores `stripe_balance_txn_id`.

- **Void:** `customer.subscription.deleted` for an invitee with a `pending`/`qualified`-but-unrewarded referral → `status='void'`, no credit (and don't claw back already-applied credits — keep it simple/goodwill).
- **`invoice.payment_failed`** → `subscription_status='past_due'`.

### E. Invite quota (the flywheel)
- Founders get 3 codes at allocation (§3-C). Their Invites page shows code + status (Available / Sent / Joined / Qualified) + credit balance.
- **Optional flywheel (off until PMF):** `+1` code when one of their referrals reaches `qualified` — rewards productive referrers without manufacturing growth.
- Standard signups get **0 codes** during launch (revisit once the founding loop is proven).

### F. Trial expiry → hard paywall ("upgrade to keep your leads") *(superseded 2026-09-06: no paywall — the 3-client cap gates "add client", nothing else is locked)*
- **Access helper** `hasAccess(profile)` = `subscription_status='active'` **OR** (`subscription_status='trialing'` AND `now() < trial_ends_at`). (`past_due` → short dunning grace with a banner; `canceled` / `none` / expired-trial → no access.)
- Enforced in **`src/lib/supabase/middleware.ts`** / the `(app)` layout: no access → redirect to **`/upgrade`**, the only reachable app route besides `/settings/billing` and sign-out.
- **`/upgrade`** = the hard paywall: *"Your trial's over — upgrade to keep your leads."* Surfaces what they'd lose ("you've added 14 clients across 3 agencies — don't lose them"), the price (founding €19 / €190 if `founding_intent`, else €29 / €290), monthly/annual toggle, Checkout button.
- **Data is retained, never deleted** — only locked behind the wall. Access is re-granted the instant `checkout.session.completed` flips status to `active`.
- **Phase 0 (pre-Stripe):** the gate + `/upgrade` page work off the DB flag alone; the Checkout button can point to a Stripe **Payment Link** until full webhooks land.

---

## 4. Server actions (`src/lib/actions/referrals.ts`)

| Action | Auth | Does |
|---|---|---|
| `validateInvite(code)` | public | `/join` page: `{ valid, inviterName, expired }`. |
| `mintInvite({ note })` | founder (quota-checked for agents) | Create a code via admin client; agents enforce `count(my invites) < invite_quota`. |
| `revokeInvite(id)` | owner | `status='revoked'`. |
| `getMyInvites()` | agent | My codes + statuses. |
| `getMyReferralSummary()` | agent | `{ referredCount, qualifiedCount, creditBalanceEur, freeMonths }`. |

RPCs (Postgres, `security definer`): `claim_founding_invite(code,uid)`, `allocate_founding_number(uid)`.
Webhook: **`src/app/api/stripe/webhook/route.ts`** (verify signature, admin client).

---

## 5. UI surfaces
1. **`/join/[code]`** — invite landing (inviter name, founding-circle framing, sign-in CTA; sets cookie). Expired → "join at standard" fallback.
2. **`/onboarding`** — start-trial screen; €19 + "Founding spot reserved" if `founding_intent`, else €29. Stripe Checkout.
3. **Invites page** (nav item or `/settings/invites`, founders only) — 3 codes w/ copy-link + status; **credit balance** ("€38 = 2 free months"); the collaboration-reframe copy: *"Invite the agents you co-broke with — your shared deals get cleaner, and you both get a free month."*
4. **Founding badge** — "Founding Agent #N" in header/profile.
5. **`/admin`** (is_admin) — seed invites, view referrals, **founder counter ("12 / 20")**, honor-or-decline in-flight trialists when the cap fills. Start as Supabase Studio; build the page in Phase 2.

---

## 6. Stripe specifics (decision locked)
- **Four recurring prices (2026-09-06):** `founding_monthly` €19 · `founding_yearly` €180 · `standard_monthly` €29 · `standard_yearly` €276 (yearly ≈ 20% off), tax-exclusive ("+ IVA"), sold through four Payment Links, recognised in the webhook by lookup key. Founders stay locked on whichever founding price they picked. *(Was: €190 / €290 annual.)*
- **Trial is DB-only, 7 days, no card** (set at signup by the trigger). **Stripe Checkout has NO `trial_period_days`** — by the time someone converts (at the paywall or "Upgrade"), the in-app trial has elapsed, so Checkout is a normal **card-required, charge-now** subscription start. Cleaner than a no-card Stripe trial that silently lapses.
- **Stripe Tax:** `automatic_tax: { enabled: true }`; collect tax IDs at checkout (`tax_id_collection`) so Spanish *autónomo* buyers get B2B reverse-charge. You register/remit EU VAT (OSS) yourself — Stripe Tax calculates; budget for a gestor to file.
- **Referral credit = customer balance transaction** (`amount: -1900`), the cleanest "one free month" mechanic — auto-applies to the next invoice, no coupon juggling.
- **Webhooks to handle:** `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`. Verify signatures; everything writes via the admin client.
- **Price-lock for founders:** they stay on `price_founding` forever; future price rises only create new prices for new customers — founders are never migrated.

---

## 7. Anti-abuse (built into the model)
- **Reward on the 2nd paid invoice, not signup** — kills fake-friend farming.
- **`unique(invitee_id)`** — referred once, ever.
- **Self-referral rejected** in `claim_founding_invite` (`inviter_id = user_id`); flag shared name/email for review.
- **Single-use, expiring, revocable codes** + locked-row atomic redemption (no double-spend).
- **Quota = 3** caps volume; standard users get 0 codes.
- **All privileged writes service-role only** (RLS denies authenticated writes).
- **No public leaderboard.** Manual founder review is the backstop at 5–20; Stripe Radar covers payment fraud later.

---

## 8. Build phasing (don't over-build for 5–20 agents)

**Phase 0 — schema + invite claim + open signup gate (the foundation):**
- Migration (profiles + trigger, invites, referrals, referral_credits, RLS, the two RPCs); hand-update `src/lib/supabase/types.ts`.
- `/join/[code]` + cookie + callback `claim_founding_invite`; `/onboarding` shell; access routing in middleware.
- Trial = DB flag at first (Stripe wiring can come in 0.5). Founder seeds codes in Studio.

**Phase 1 — Stripe live:** two prices, no-card Checkout, webhooks → auto founding allocation (the 20-cap), auto referral qualification + credit application. Invites page + founding badge + `mintInvite` quota.

**Phase 2 — polish:** `/admin` dashboard, optional quota-replenishment flywheel, annual prices.

---

## 9. Resolved decisions
- ✅ **Billing:** Stripe + Stripe Tax (credits via customer balance transactions; budget a gestor for EU OSS filing).
- ✅ **Tiers (2026-09-06):** **Free** (max **3 clients**, every row incl. inactive; nothing ever deleted — only *adding* is blocked over the cap) and **Pro €29/mo + IVA**. **No time trial** — Free is the trial. ~~7-day trial + hard paywall~~.
- ✅ **Prices (2026-09-06):** €19/mo or €180/yr founding · €29/mo or €276/yr standard (yearly ≈ 20% off). ~~€190 / €290 annual~~.
- ✅ **Founding cap:** first **20 paying** agents — **public since 2026-09-06**, no invite needed; the pricing page shows spots left and flips to standard at 0; allocated atomically at first payment. **€19 locked for life** — Stripe keeps a subscription on its original price object, so the lock needs no code.
- ✅ **No-invite arrivals:** **open signup on Free**, Pro at €29 standard — invite is a founding+referral token, not an access gate; exclusivity lives in the Founding tier.
- ✅ **Codes per founder:** ~~3; standard users get 0 during launch~~ **(2026-09-06: every agent gets one permanent referral link; codes, quota, expiry and seeding are gone).**
- ✅ **Free referrers (2026-09-06):** a comped Pro month from the backend (`pro_until`), no subscription needed; subscribers get a balance credit worth one month of their plan. The reward still fires only on the invitee's 2nd paid invoice.
- ✅ **Cancel path (2026-09-06):** Stripe Customer Portal (cancel + payment method only, no plan switching); cancellation = back to Free, data untouched.

### Remaining judgment call (flag, don't block)
1. **In-flight trialist honor policy** when the 20th slot fills — recommend a written default ("invited + trialing before close ⇒ keep €19") so it's not ad-hoc.

### ⚠️ One risk to watch *(moot since 2026-09-06 — there is no trial)*
A **7-day** trial is tight for time-to-value — the pricing research flagged that loading real cross-agency clients + seeing an AI follow-up cycle can take longer than a week. It works **if** activation is front-loaded: concierge onboarding on day 1 for founders (you're doing this anyway), and for self-serve standard signups, an onboarding checklist that gets them to the "aha" fast. Watch self-serve trial→paid conversion; trivial to extend to 14 days later if it's too short.
