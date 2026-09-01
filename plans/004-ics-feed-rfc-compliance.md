# Plan 004: Make the public ICS feed RFC 5545-compliant and uncacheable by shared caches

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 4286cc9..HEAD -- src/lib/ics.ts src/app/api/calendar/[token]/route.ts src/lib/calendar-feed-token.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md (test runner + existing feed-token tests)
- **Category**: bug / security
- **Planned at**: commit `4286cc9`, 2026-06-12

## Why this matters

`/api/calendar/[token]` is the app's **only public endpoint** — agents subscribe Google/Apple/Outlook calendars to it. The ICS builder never folds lines, but RFC 5545 §3.1 requires content lines ≤ 75 octets (folded with CRLF + space); long property addresses and viewing notes are the norm in this domain, and strict parsers truncate or drop such events. The stream also lacks the conventional trailing CRLF. Separately, the response is served with `Cache-Control: public, max-age=3600`: the URL token is the only access control, and `public` invites shared caches (CDN/corporate proxies) to store a PII-bearing body. Caches are URL-keyed so cross-tenant serving still requires the token — this is hardening, not a live leak — but the correct header costs one line.

## Current state

- `src/lib/ics.ts` — pure ICS builder used only by the feed route. As of `4286cc9` (`:23-48`):

  ```ts
  export function buildICS(calName: string, events: ICSEvent[]): string {
    const now = stamp(new Date());
    const lines: string[] = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lena//Calendar//EN",
      "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${esc(calName)}`,
    ];
    for (const e of events) {
      lines.push("BEGIN:VEVENT", `UID:${e.uid}`, `DTSTAMP:${now}`,
        `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end)}`, `SUMMARY:${esc(e.summary)}`);
      if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
      if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }
  ```

  `esc()` (`:10-16`) already escapes `\`, `;`, `,` and converts newlines to `\n` — escaping is correct; only folding and the final CRLF are missing. `stamp()` (`:19-21`) emits UTC basic format — correct.

- `src/app/api/calendar/[token]/route.ts` — verifies the token, queries via the service-role admin client **scoped by `agent_id`** (by design — subscribers fetch with no session), builds the ICS. The response (`:89-95`):

  ```ts
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": 'inline; filename="lena.ics"',
    },
  });
  ```

- `src/lib/calendar-feed-token.ts` — HMAC-SHA256 token (`<b64url id>.<sig>`), documented design (non-expiring, signed with the service-role key — do NOT change that design). The verify compare (`:36-39`) compares the **base64url strings'** UTF-8 bytes:

  ```ts
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? agentId : null;
  ```

  Functionally correct today (base64url is ASCII), but the idiomatic form compares decoded digests. Plan 001 created round-trip/tamper tests in `src/lib/calendar-feed-token.test.ts` that must keep passing.

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npm run typecheck` | exit 0              |
| Tests     | `npm test`          | exit 0, all pass    |
| Lint      | `npm run lint`      | exit 0 (4 pre-existing warnings OK) |

## Scope

**In scope** (the only files you should modify/create):
- `src/lib/ics.ts`
- `src/lib/ics.test.ts` (create)
- `src/app/api/calendar/[token]/route.ts` (the headers object only)
- `src/lib/calendar-feed-token.ts` (the two `Buffer.from` lines only)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- The token design (HMAC of agent id, non-expiring, service-role signing key) — documented decision.
- The route's queries and admin-client usage — by design and correctly scoped.
- `src/components/calendar/calendar-sync-dialog.tsx` — the subscribe UI is unaffected.

## Git workflow

- Branch: `advisor/004-ics-rfc-compliance`
- Commit style: `fix: fold ICS lines per RFC 5545 + private cache on the feed`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a UTF-8-safe fold and trailing CRLF to `buildICS`

In `src/lib/ics.ts` add:

```ts
/** RFC 5545 §3.1: fold content lines to ≤75 octets, continuation lines
 *  start with a single space. Splits on UTF-8 byte boundaries so a
 *  multi-byte character is never cut in half. */
function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    // first segment gets 75 octets; continuations get 74 (the leading space costs 1)
    let len = Math.min(start === 0 ? 75 : 74, bytes.length - start);
    // back off if we'd split a UTF-8 continuation byte (0b10xxxxxx)
    while (len > 1 && start + len < bytes.length && (bytes[start + len] & 0xc0) === 0x80) len--;
    out.push(bytes.subarray(start, start + len).toString("utf8"));
    start += len;
  }
  return out.join("\r\n ");
}
```

Change the return to fold every line and end with CRLF:

```ts
return lines.map(fold).join("\r\n") + "\r\n";
```

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Tests for the builder

Create `src/lib/ics.test.ts` (pattern: plan 001's colocated vitest files). Cases:

- Short event: output contains `SUMMARY:Meeting with Anna`, starts with `BEGIN:VCALENDAR`, ends with `END:VCALENDAR\r\n` (assert the trailing CRLF).
- Escaping (unchanged behavior): summary `a;b,c\nd` → `SUMMARY:a\;b\,c\nd` (escaped semicolon/comma, literal backslash-n).
- Folding: a 300-char ASCII description → every physical line of the output (split on `\r\n`) is ≤ 75 bytes; lines after the first part of that property start with a space; **unfolding** (replace `\r\n ` with ``) reconstructs the original logical line exactly.
- Multibyte safety: a summary of 60 × `"é"` (2 bytes each) → all physical lines ≤ 75 bytes AND unfolding round-trips to the original string (no replacement characters — assert `!unfolded.includes("�")`).
- DTSTART format: a known Date renders as `DTSTART:YYYYMMDDTHHMMSSZ` (regex `\d{8}T\d{6}Z`).

**Verify**: `npm test` → exit 0, new ics tests pass.

### Step 3: Cache header

In `src/app/api/calendar/[token]/route.ts` change exactly one line:

```ts
"Cache-Control": "private, no-store",
```

(Calendar clients poll the feed themselves on their own schedule; losing shared-cache hits is irrelevant at this scale.)

**Verify**: `grep -n "no-store" "src/app/api/calendar/[token]/route.ts"` → 1 match; `grep -rn "public, max-age" src/app/api/` → no matches.

### Step 4: Canonical digest comparison in `verifyFeedToken`

Replace the two buffer constructions (`src/lib/calendar-feed-token.ts:36-37`) with decoded digests:

```ts
const a = Buffer.from(sig, "base64url");
const b = Buffer.from(expected, "base64url");
```

(Keep the length check and `timingSafeEqual` exactly as they are. Behavior note: this also makes the check robust to padding/format variants rather than rejecting them, and compares the actual 32-byte HMAC values.)

**Verify**: `npm test` → exit 0 — plan 001's round-trip and tamper tests in `src/lib/calendar-feed-token.test.ts` still pass unchanged.

## Test plan

See Step 2 (five named cases). Plus the regression guarantee in Step 4: the pre-existing token tests pass without modification. Full suite: `npm test` → exit 0.

## Done criteria

- [ ] `npm run typecheck` exits 0; `npm test` exits 0; no new lint warnings
- [ ] `src/lib/ics.test.ts` exists with folding + multibyte + escaping + trailing-CRLF cases, all passing
- [ ] Every physical line of `buildICS` output is ≤ 75 octets (asserted by a test, not by eye)
- [ ] `grep -n '"Cache-Control": "private, no-store"' "src/app/api/calendar/[token]/route.ts"` → 1 match
- [ ] `src/lib/calendar-feed-token.test.ts` unmodified and passing
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 001 has not landed (no `npm test`, no `calendar-feed-token.test.ts`) — execute 001 first.
- The pre-existing token tests fail after Step 4 — that means a token format assumption was wrong; revert Step 4 and report rather than editing the tests.
- You're tempted to change `esc()` — escaping is correct and out of this plan's brief; report if a test reveals otherwise.

## Maintenance notes

- If a future feature adds new ICS properties (e.g. `URL:`, `ORGANIZER:`), they must go through `fold()` automatically (they will, if pushed onto `lines` before the final map) — reviewer should check any later ICS change keeps that invariant.
- The `private, no-store` header means each subscriber poll hits the DB; if feed traffic ever matters, the right lever is `private, max-age=3600` (browser-only caching), never `public`.
- Deferred: token revocation/rotation (would need versioned tokens or per-agent secrets — a design change the maintainer explicitly made the other way; revisit only if a feed URL actually leaks).
