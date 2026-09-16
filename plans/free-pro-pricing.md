# LeadWing — Free + Pro pricing (decision record + change list)

*Decided 2026-09-06, revised the same day after founder review: founding is public, yearly billing exists, and referral rewards for non-subscribers are comped Pro time. Supersedes the trial / hard-paywall / invite-gated-founding sections of `invite-referral-spec.md` and the "paid from day one" stance in `gtm-strategy.md`; both carry dated notes pointing here.*

> **Status (2026-09-06): code complete, not yet live.** Everything in §3 is implemented and verified (typecheck, lint, unit tests, `next build`, and the migration executed against a throwaway Postgres with scenario assertions). Still to do, in order: `supabase db push` (this is the first time `profiles` exists on the live database), the Stripe dashboard setup in §2, the Vercel env vars, then a test-mode checkout. Until the migration runs, the deployed app keeps working as before: no profile row means no cap is applied in the UI.

> **Update 2026-09-16: the Free cap is 10 clients, not 3.** Three was the smallest free plan in the market (Fincta allows 12, Witei 250 contacts, inmoGesco and PropertyList unlimited), and no real agent had reached it. `FREE_CLIENT_LIMIT` in `src/lib/access.ts` and the trigger (migration `20260916120000_free_client_limit_ten.sql`) both say 10. Wherever this record says 3 below, read 10.

## 1. Decisions

| Question | Decision |
|---|---|
| Tiers | **Free** and **Pro**. One difference: Free is capped at **10 clients** (3 until 2026-09-16). |
| What counts | Every `clients` row for the agent — buyers and sellers together, **including inactive/archived**. Deleting a client frees a slot. |
| Pro price | **€29 / month + IVA**, or **yearly at ≈20% off**. Exact 20% is €278.40; rounded to **€276 / year (€23 / month)** so the per-month figure is a round number. |
| Founding | **Public.** The **first 20 paying agents**, whoever they are, lock the founding price for life: **€19 / month** or **€180 / year (€15 / month)**. The pricing page shows **"N of 20 founding spots left"**; at 0 it flips to the standard prices. Stripe guarantees the lock: a subscription bills at the price object it was created on, forever. |
| Invites | **Replaced by referral links.** Every agent gets one permanent link at signup. No codes to mint, no quota, no expiry, no revoking, no founder seeding. |
| Trial | **Removed.** No time limit anywhere. Free *is* the trial. |
| Downgrade / cancel | Profile goes back to Free. **Nothing is deleted.** Everything stays visible and editable; only *adding* a client is blocked while over the cap. |
| Referral reward | Fires on the referred agent's **2nd paid invoice**, one free month to **both** sides. Never on signup. |
| How a free month is delivered | **Subscriber:** Stripe customer-balance credit worth one month of *their* plan (€19 / €29, or the monthly equivalent on yearly). **Not subscribed:** **Pro comped for one month from the backend** (`pro_until`), no card, no subscription. The same mechanic comps design partners from `/admin`. |
| Referral dashboard | `/referrals`: your link, each referred agent with state **Signed up → Subscribed → Free month earned / Left**, and your rewards (Pro until a date, or credits applied). |
| Cancel path | Stripe **Customer Portal** behind "Manage subscription". Portal config: cancel + payment-method update only, **no plan switching** (protects the founding lock). |
| Pricing page | Two columns: **Free forever · 3 clients** vs **Pro · unlimited**, with a **Monthly / Yearly** toggle on Pro and the founding banner while spots remain. The word "trial" never appears. |

## 2. Stripe setup (dashboard, one-time)

1. Product **LeadWing Pro**, four recurring prices, EUR, tax behaviour **exclusive** ("+ IVA"), each with a **lookup key** the webhook reads to recognise the plan:

   | lookup key | amount | interval |
   |---|---|---|
   | `founding_monthly` | €19.00 | month |
   | `founding_yearly` | €180.00 | year |
   | `standard_monthly` | €29.00 | month |
   | `standard_yearly` | €276.00 | year |

2. Four **Payment Links**, one per price: Stripe Tax **on**, tax-ID collection **on**, promotion codes **off**, quantity changes **off**, success URL `https://www.leadwing.app/referrals?upgraded=1`.
3. **Webhook endpoint** `https://www.leadwing.app/api/stripe/webhook` — the **www** host: the apex answers 308 and Stripe does not follow redirects. Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. **Customer Portal** configuration: allow cancel (at period end), allow payment-method update, invoice history on; **disable** subscription switching / quantity updates.
5. **Vercel env:** the four `NEXT_PUBLIC_STRIPE_LINK_*` vars already listed in `.env.example`, plus `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
6. Test mode first: `stripe listen --forward-to localhost:3000/api/stripe/webhook`; one founding and one standard checkout, one yearly, one cancellation via the portal, one referral reaching its 2nd invoice.

## 3. Code changes

### 3.1 Database — one consolidated migration
Verified 2026-09-06: the live project has `clients` but **no** `profiles`, `referrals` or `stripe_events`, so `20260625120000_invites_referrals.sql` and `20260902120000_referral_engine.sql` were never applied. Replace both with a single `2026090xxxxxxx_billing_referrals.sql`:

- **`profiles`**: `id`, `email`, `full_name`, `is_admin`, `cohort`, `founding_number` (unique), `referral_code` (text, unique, 8-char Crockford), `referred_by`, `stripe_customer_id`, `subscription_status` (`none` | `active` | `past_due` | `canceled`, default `none`), `plan` (one of the four lookup keys, null on Free), `plan_monthly_eur` (19 / 15 / 29 / 23 — the value of "one free month"), `pro_until` (timestamptz, comped Pro), timestamps. **Dropped from the old design:** `founding_intent`, `invite_quota`, `trial_ends_at`, `price_locked_eur`, the `trialing` status, the whole `invites` table and its enum.
- **`handle_new_user()`**: profile with a fresh `referral_code`, status `none`. One-off insert for existing `auth.users` rows (same as the old migration did, minus the trial).
- **`is_pro(uid)`**: status in (`active`, `past_due`) **or** `pro_until > now()`.
- **Trigger `clients_enforce_free_limit`** before insert on `clients`: lock the agent's `profiles` row (`for update`) to serialise concurrent inserts, count **all** client rows, raise `client_limit_reached` when count ≥ 3 and not pro. `security definer`, `search_path = ''`.
- **`allocate_founding_number(uid)`**: keep (advisory lock, cap 20). Remove the `founding_intent` gate.
- **`claim_referral(code, user)`** replaces `claim_founding_invite`: find the inviter by `referral_code`, reject self-referral, one referral per invitee (`unique (invitee_id)`), insert `referrals` as `pending`, set `referred_by`. Nothing about founding.
- **`record_paid_invoice(uid)`**: same counting; at the 2nd invoice, for each side: subscribed → insert a `referral_credits` row worth `plan_monthly_eur` (applied to the Stripe balance by the app); not subscribed → `pro_until = greatest(coalesce(pro_until, now()), now()) + interval '1 month'` and a ledger row marked `granted_as = 'pro_time'` so the referrals page can show it.
- **`grant_pro_time(uid, months, reason)`**: the admin comp, same mechanic.
- **`void_referral`, `stripe_events`, `referral_credits`** (+ `granted_as` column): keep.

### 3.2 Access model
- `src/lib/access.ts`: `isPro(profile)` (status or `pro_until`) and `clientLimit(profile)` (3 or unlimited) replace `hasAccess` / `accessState`. Rewrite `access.test.ts`.
- `src/app/(app)/layout.tsx`: delete the `/upgrade` redirect. The app is always open.
- `src/lib/supabase/middleware.ts`: allow `/join` and `/api/stripe` as today.

### 3.3 The cap in the app
- `src/lib/actions/clients.ts` `createClient` and every other client-insert path (lead paste): count vs limit first, return a `limit` result instead of throwing; the DB trigger is the backstop.
- New-client button / dialog: at the cap and not Pro → prompt "You've used your 3 free clients — Pro is unlimited" linking to `/pricing`.
- Sidebar meter "2 of 3 free clients" for Free agents; "Pro until 6 Oct" for comped agents.

### 3.4 Pricing page — `/upgrade` becomes `/pricing`
- Two columns; Pro has a Monthly / Yearly toggle (client component) that swaps the Payment Link.
- Founding banner while `founderCount < 20`: "**N of 20 founding spots left** — €19/mo or €180/yr, locked for life" and the founding links. At 0 spots: €29/mo or €276/yr and the standard links. No account state involved.
- Links carry `client_reference_id` + `prefilled_email` as today.
- Already Pro → "You're on Pro" + Manage subscription. Comped → "Pro until {date}, earned from a referral" + subscribe CTA.
- Remove the "trial's over" copy; keep the "nothing is deleted" reassurance.

### 3.5 Billing UI
- Server action `openBillingPortal()`: `stripe.billingPortal.sessions.create({ customer, return_url })` → redirect. Button on `/pricing` and in settings for subscribers. Needs `stripe_customer_id`, which the webhook stores.
- *Revised 2026-09-06, after the first live checkout:* the portal button lives on a dedicated **`/billing`** page inside the app shell (plan and status, next invoice from Stripe's preview, payment method, free-month credits, invoice history with PDF links). `/pricing` links there for subscribers, and both checkout (`/billing?upgraded=1`) and the portal return there.

### 3.6 Webhook — `src/app/api/stripe/webhook/route.ts`
- `checkout.session.completed`: link the customer, set `active`, retrieve the subscription and read `items[0].price.lookup_key` → `plan` + `plan_monthly_eur`; if the key starts with `founding_` call `allocate_founding_number` (if the cap filled during checkout they keep the €19 price — Stripe already charged it — but get no number; that is the accepted boundary case); then `applyPendingCredits(userId)` so earlier credits land on the next invoice.
- `invoice.paid`, `invoice.payment_failed`, `customer.subscription.*`: as today. Cancellation now simply means Free.

### 3.7 Referrals UI — `/invites` becomes `/referrals`
- `/join/[code]`: look up the inviter by `referral_code`; landing shows the inviter's name and, while open, the founding spots left. Accept → cookie → sign in → `/join/claim` calls `claim_referral`.
- `/referrals`: the link with a copy button, referred agents with state (Signed up / Subscribed / Free month earned / Left), rewards summary, Founding Agent #N badge when applicable.
- Remove `mintInvite`, revoke, quota, and `INVITE_*` constants except the code alphabet, which the DB generator mirrors.

### 3.8 Admin — `/admin`
- Remove seed codes and the invites table. Keep founder counter, agents (make founder / set status / paid invoice), referrals and credits ledgers. Add **"Comp 1 month"** (calls `grant_pro_time`).

### 3.9 Copy and docs
- `.env.example`: comments only (four links already there).
- `README.md` billing and referral paragraphs.
- Landing page `src/app/page.tsx`: pricing section → Free forever / Pro €29 / founding spots left.
- `plans/invite-referral-spec.md`, `plans/gtm-strategy.md`: dated notes (done).

## 4. Order of work
1. Migration + access model + cap (3.1–3.3). The app works fully without Stripe.
2. Referral link, `/join`, `/referrals`, admin (3.7, 3.8).
3. Pricing page (3.4).
4. Stripe dashboard (§2), webhook, portal (3.5, 3.6) in test mode.
5. Go live: `supabase db push`, Vercel env, one real founding checkout.

## 5. Boundary cases, decided
- **Cap fills mid-checkout:** the late payer keeps the €19 price (already charged and locked) but gets no founding number. At most one extra founder; accepted.
- **Comped agent subscribes early:** the remaining comp time is simply overlapped, not converted. Accepted for simplicity.
- **Comp expires over the cap:** adding is blocked, nothing is deleted, the prompt links to `/pricing`.
- **Free month for a yearly subscriber:** a credit of the monthly equivalent (€15 or €23) on the balance, applied to the next invoice.
- **Abuse:** a referral only pays at the referee's 2nd paid invoice, one referral per invitee, self-referral rejected. A Free agent cannot farm comped months without real payers.

## 6. Deliberately not built now
A 14-day Pro trial. Extra client slots as a Free-tier reward. Converting unused comp time into credit. Public leaderboard. Founding spots counter on the landing page beyond the pricing section.
