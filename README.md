# Lena — Real Estate CRM

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

