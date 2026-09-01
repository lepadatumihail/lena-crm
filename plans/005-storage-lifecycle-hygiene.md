# Plan 005: Make storage cleanup ordered and error-checked, and fix the revalidatePath targets

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 4286cc9..HEAD -- src/lib/actions/clients.ts src/lib/actions/buyer.ts src/lib/actions/documents.ts src/components/file-upload.tsx`
> Plans 003 (input checks) intentionally touches three of these files — if it
> landed, its additions are expected; anything else that contradicts the
> excerpts below is a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/003-server-action-input-contracts.md (same files — execute 003 first to avoid conflicts); plans/001 for the test runner (no new unit tests here, but the suite must stay green)
- **Category**: bug
- **Planned at**: commit `4286cc9`, 2026-06-12

## Why this matters

Deletion flows remove storage objects **before** the DB row and ignore every storage error, so a transient failure can orphan client documents (PDFs, IDs — real PII) invisibly in the bucket, or delete files for a row that then fails to delete. Uploads have the inverse hole: if the DB insert after a successful upload fails, the uploaded object is stranded forever. Separately, the client mutations revalidate `"/clients"` — a pure redirect page — instead of the real list routes `/clients/buyers` and `/clients/sellers`; the bundled Next 16 docs state the current "revalidate everything previously visited" behavior is **temporary**, so this latent wrong-path bug will surface as stale lists when Next narrows it.

## Current state

- `src/lib/actions/clients.ts` `deleteClient` (`:82-119`): collects `documents.storage_path` + `viewing_attachments.storage_path` for the client, then:

  ```ts
  for (let i = 0; i < paths.length; i += REMOVE_CHUNK_SIZE) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(paths.slice(i, i + REMOVE_CHUNK_SIZE));   // result ignored
  }
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };           // files already gone
  revalidatePath("/clients");
  ```

  Also note: the two collection queries' errors (`const { data: docs } = ...`) are ignored — a failed collection silently means "no files to remove".

- `src/lib/actions/buyer.ts` `deleteViewing` (`:92-114`): same pattern — `.remove(paths)` result ignored, then row delete. `deleteViewingAttachment` (`:139-161`): `.remove([att.storage_path])` ignored, then row delete.
- `src/lib/actions/documents.ts` `deleteDocument` (`:34-55`): `.remove([doc.storage_path])` ignored, then row delete.
- `src/components/file-upload.tsx` `handleFiles` (`:107-122`): uploads to storage first, then calls `onUploaded(meta, file)`; when the consumer returns `false` (its server action failed — see `documents-section.tsx:50-57` which returns `false` on `addDocument` error) the already-uploaded object at `meta.storage_path` is never removed:

  ```ts
  const meta = await upload(file);
  if (meta) {
    const result = await onUploaded(meta, file);
    if (result !== false) saved += 1;     // false → file orphaned in the bucket
  }
  ```

  The hook already has a `supabase` browser client in scope inside `upload()`; `handleFiles` can create one the same way (`createClient()` from `@/lib/supabase/client`).

- `revalidatePath("/clients")` call sites in `clients.ts`: lines 46 (`createClient`), 77 (`updateClient`), 117 (`deleteClient`), 131 (`updateClientStage`), 146 (`setClientPriority`), 161 (`setClientActive`). The real list pages are `src/app/(app)/clients/buyers/page.tsx` and `.../sellers/page.tsx`; `src/app/(app)/clients/page.tsx` is a redirect. Helper available: `clientsPath(side)` in `src/lib/crm.ts` returns `"/clients/buyers" | "/clients/sellers"`.
- Authority on semantics: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md` — "**Pages**: Invalidates the specific page", and the Good-to-know noting today's broader behavior is temporary.
- Conventions: actions return `{ error: string | null }`; storage bucket constant `STORAGE_BUCKET = "attachments"` exists in `clients.ts`, `buyer.ts`, `documents.ts`, `file-upload.tsx`.

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npm run typecheck` | exit 0              |
| Tests     | `npm test`          | exit 0, all pass    |
| Lint      | `npm run lint`      | exit 0 (4 pre-existing warnings OK) |

## Scope

**In scope** (the only files you should modify):
- `src/lib/actions/clients.ts`
- `src/lib/actions/buyer.ts` (only `deleteViewing`, `deleteViewingAttachment`)
- `src/lib/actions/documents.ts` (only `deleteDocument`)
- `src/components/file-upload.tsx` (only `handleFiles`)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- The plan-003 additions (auth gates, path checks) in these same files — leave them exactly as 003 wrote them.
- `src/app/(app)/clients/page.tsx` (the redirect) and the list pages — no route changes.
- Schema/migrations — no DB-side cascade-to-storage tricks (Supabase storage objects are not rows; an SQL trigger can't remove them).
- Switching to `revalidateTag`/`cacheTag` — these pages are fully dynamic; literal paths are the right shape here.

## Git workflow

- Branch: `advisor/005-storage-lifecycle`
- Commit style: `fix: ordered, error-checked storage cleanup + correct revalidate targets`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Reorder `deleteClient` — row first, then storage, all errors checked

Rewrite the body to: (1) collect paths exactly as today **but** check both collection queries' errors (`if (docsRes.error) return { error: docsRes.error.message };` etc. — destructure the full response, not just `data`); (2) delete the `clients` row and return on error (cascades remove the child rows); (3) only then remove storage objects in the existing 100-path chunks, collecting failures:

```ts
const failed: string[] = [];
for (let i = 0; i < paths.length; i += REMOVE_CHUNK_SIZE) {
  const chunk = paths.slice(i, i + REMOVE_CHUNK_SIZE);
  const { error: removeError } = await supabase.storage.from(STORAGE_BUCKET).remove(chunk);
  if (removeError) failed.push(...chunk);
}
if (failed.length) {
  console.error(`deleteClient: ${failed.length} storage object(s) not removed`, failed);
  return { error: `Client deleted, but ${failed.length} file(s) could not be removed from storage.` };
}
```

(The row is gone either way — the error string exists so the UI says so honestly. Keep the path-collection-before-row-delete order: after the cascade the paths are unrecoverable.)

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Same row-first + error-check shape for the three small deletes

- `deleteViewing` (`buyer.ts`): collect attachment paths (check the query error) → delete the `viewings` row (return on error) → `.remove(paths)` with the same destructure-and-report pattern (single chunk is fine — a viewing has few attachments).
- `deleteViewingAttachment` (`buyer.ts`) and `deleteDocument` (`documents.ts`): look up the path (as today) → delete the row (return on error) → `.remove([path])`, and on remove error return `{ error: "Deleted, but the file could not be removed from storage." }`.

**Verify**: `npm run typecheck` → exit 0; `grep -n "storage.from" src/lib/actions/*.ts` — every call site now destructures `{ error` (manual inspection of the grep output).

### Step 3: Clean up the orphan on failed post-upload insert

In `file-upload.tsx` `handleFiles`, when `onUploaded` returns `false`, best-effort remove the just-uploaded object:

```ts
const result = await onUploaded(meta, file);
if (result !== false) {
  saved += 1;
} else {
  void createClient().storage.from(STORAGE_BUCKET).remove([meta.storage_path]);
}
```

(Best-effort `void` is acceptable here — the consumer already showed its own error toast; do not add a second toast.)

**Verify**: `npm run typecheck` → exit 0; `npm run lint` → exit 0, no new warnings.

### Step 4: Correct the six revalidate targets in `clients.ts`

Import `clientsPath` from `@/lib/crm`. Replace `revalidatePath("/clients")`:

- `createClient`: knows the side → `revalidatePath(clientsPath(v.side));`
- `updateClient`: side is in `v.side` → `revalidatePath(clientsPath(v.side));` (keep the existing `/clients/${id}` call).
- `deleteClient`, `updateClientStage`, `setClientPriority`, `setClientActive`: the side isn't loaded — revalidate both lists:

  ```ts
  revalidatePath("/clients/buyers");
  revalidatePath("/clients/sellers");
  ```

  (Two calls beat an extra DB read; these pages are dynamic, the call is cheap.) Keep every existing `/clients/${id}` revalidation as is.

**Verify**: `grep -n 'revalidatePath("/clients")' src/lib/actions/clients.ts` → **no matches**; `npm run typecheck` → exit 0.

## Test plan

No new unit tests — every change is glued to Supabase storage/DB calls (not unit-testable under the plan-001 setup without heavy mocking). Verification is type-level + the greps above + the full suite staying green: `npm test` → exit 0.

Manual smoke (optional, requires `.env.local` + `npm run dev`): upload a document to a client, delete the client, confirm in Supabase Studio → Storage that the object is gone; create + delete a single document and confirm the same.

## Done criteria

- [ ] `npm run typecheck` exits 0; `npm test` exits 0; no new lint warnings
- [ ] In all four files, every `storage.from(STORAGE_BUCKET).remove(...)` call's result is checked (or explicitly `void` with the Step 3 justification comment context)
- [ ] In all delete actions the DB row delete happens **before** the storage removal
- [ ] `grep -rn 'revalidatePath("/clients")' src/` → no matches
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The function bodies differ materially from the excerpts and plan 003's expected additions can't account for the difference.
- You find a caller that depends on `deleteClient` returning success even when storage cleanup fails (search usages: `grep -rn "deleteClient" src/components`) — the UI currently treats any `error` string as a failure toast; if that toast wording would mislead ("couldn't delete client" when the client IS deleted), report with the component path instead of inventing new UI.
- Reordering would conflict with a plan-003 ownership check in a way the steps don't anticipate.

## Maintenance notes

- Invariant to preserve in review: **rows before files** on delete, **files then row** on create (with cleanup on row failure) — and no storage call's error silently dropped.
- If bulk client deletion is ever added, the chunked removal + failure accumulation in Step 1 is the pattern to reuse.
- Deferred: a periodic orphan-sweep job (list bucket prefixes vs. document rows) — only worth building if the Studio storage view shows real drift accumulating.
