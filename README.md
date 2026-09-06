# LeadWing — Real Estate CRM

A CRM for independent real estate agents on the Costa del Sol. Each agent is an
isolated tenant (Row Level Security keys every row to `auth.uid()`), tracking
**buyers** and **sellers** through stage-based pipelines with documents, viewings
and offers.

Stack: Next.js (App Router) · Supabase (Postgres + Auth + Storage + RLS) ·
Tailwind v4 · shadcn-style UI · TanStack Table · dnd-kit.

## Setup

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com/dashboard). From
**Project Settings → API**, copy the Project URL and the anon/publishable key.

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # or NEXT_PUBLIC_SUPABASE_ANON_KEY for legacy projects
SUPABASE_SERVICE_ROLE_KEY=<service role / secret key>     # server-only
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Apply the database schema

The schema + RLS + storage policies live in `supabase/migrations/`. Apply them to
your project:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

(Or paste the migration SQL into the Supabase SQL editor.) Optionally regenerate
types afterwards: `npx supabase gen types typescript --linked > src/lib/supabase/types.ts`.

### 4. Enable auth providers

In **Authentication → Providers**:

- **Email** (magic link) — enabled by default.
- **Google** — enable it and add a Google OAuth client
  ([Google Cloud Console](https://console.cloud.google.com/apis/credentials)).
  Set the Supabase callback URL as an authorized redirect URI.

Add `http://localhost:3000/**` (and your production URL) to
**Authentication → URL Configuration → Redirect URLs**.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Design system

The UI follows the getdesign "claude" preset. To (re)generate the spec:

```bash
npx getdesign@latest add claude
```

This writes `DESIGN.md` to the repo root; the Tailwind theme in
`src/app/globals.css` should be reconciled against it.

## Deferred

Email follow-up automation (send-as-agent via Gmail API / Microsoft Graph with a
Resend fallback) is designed into the schema (`email_accounts`,
`email_templates`, `scheduled_emails`) but not built in v1.

## Plans, founding cohort and referrals

Two plans, one difference. **Free** holds 3 clients (every row counts,
inactive too; nothing is ever deleted, only adding a 4th is blocked). **Pro**
is unlimited: €29/mo or €276/yr, and the first 20 paying agents lock
€19/mo or €180/yr for life. There is no time trial. Decision record:
`plans/free-pro-pricing.md`.

- The cap: `src/lib/access.ts` (`isPro`, `canAddClient`) in the app, the
  trigger `clients_enforce_free_limit` in the database as the backstop.
  Pro = a live Stripe subscription (dunning included) or comped time
  (`profiles.pro_until`).
- `/pricing` — Free vs Pro with a monthly/yearly toggle, the founding spots
  left, Stripe Payment Links tagged with the agent's id, and the Customer
  Portal for subscribers.
- `/join/[code]` — referral landing; `accept` stores the code in an httpOnly
  cookie, `/join/claim` records it after sign-in via `claim_referral`. Every
  agent gets one permanent code (`profiles.referral_code`).
- `/referrals` — the agent's link, the agents they referred (signed up →
  subscribed → free month earned), and their rewards.
- `/admin` — founder-only: founder counter, record payments by hand, make
  founders, comp Pro months (`is_admin` is flipped in Supabase Studio).
- `/api/stripe/webhook` — links customers, reads the plan from the price's
  lookup key, allocates founding numbers, counts paid invoices (the 2nd one
  rewards both sides), mirrors subscription status. Idempotent through
  `stripe_events`.

A referral reward is one free month each. Subscribers get it as a Stripe
customer-balance credit worth a month of their plan; anyone else gets a
month of Pro from the backend, no card needed.

Engine: `src/lib/referrals/engine.ts`; atomic pieces are the RPCs in
`supabase/migrations/20260906120000_billing_referrals.sql`. Apply it with
`supabase db push` (or paste into the SQL editor) before deploying; it also
creates profiles for existing users, who start on Free.
