/**
 * Creates or updates one public agent page (/agent/<slug>) from a JSON file,
 * until agents can edit their own page in the app.
 *
 *   node --experimental-strip-types --no-warnings --env-file=.env.local \
 *     scripts/agent-page.ts <page.json> [--dry-run]
 *
 * The JSON follows agentPageInputSchema (src/lib/agent-pages/content.ts):
 * the agent's LeadWing account email, the slug, languages, areas and the
 * page text per language. An optional "photo" is a local image path, which
 * is uploaded to the public agent-photos bucket. Changing the slug keeps the
 * old one, which forwards to the new address. A published, real page is
 * then sent to IndexNow so Bing (and ChatGPT search) pick it up quickly.
 *
 * Keep page JSON files out of the repo: they hold people's details.
 */
import { readFile } from "node:fs/promises";
import { extname } from "node:path";

import { createClient } from "@supabase/supabase-js";

import {
  agentPageInputSchema,
  agentPath,
  isIndexable,
  pageFromRow,
} from "../src/lib/agent-pages/content.ts";
import { INDEXNOW_ENDPOINT, INDEXNOW_ORIGIN, indexNowBody } from "../src/lib/indexnow.ts";

const PHOTO_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
if (!file) {
  console.error("usage: scripts/agent-page.ts <page.json> [--dry-run]");
  process.exit(2);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (--env-file=.env.local)");
  process.exit(2);
}

const parsed = agentPageInputSchema.safeParse(JSON.parse(await readFile(file, "utf8")));
if (!parsed.success) {
  for (const issue of parsed.error.issues) console.error(`✗ ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}
const input = parsed.data;
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: agent, error: agentError } = await db
  .from("profiles")
  .select("id, email")
  .ilike("email", input.agentEmail)
  .maybeSingle();
if (agentError) throw new Error(agentError.message);
if (!agent) {
  console.error(`✗ No LeadWing account uses ${input.agentEmail}. The agent signs up first.`);
  process.exit(1);
}

const { data: existing, error: existingError } = await db
  .from("agent_pages")
  .select("id, slug, previous_slugs, photo_path")
  .eq("agent_id", agent.id)
  .maybeSingle();
if (existingError) throw new Error(existingError.message);

let photoPath: string | null = existing?.photo_path ?? null;
if (input.photo) {
  const type = PHOTO_TYPES[extname(input.photo).toLowerCase()];
  if (!type) throw new Error(`photo must be .jpg, .png or .webp: ${input.photo}`);
  const bytes = await readFile(input.photo);
  if (bytes.byteLength > PHOTO_MAX_BYTES) throw new Error("photo is over 5 MB");
  photoPath = `${agent.id}/${crypto.randomUUID()}${extname(input.photo).toLowerCase()}`;
  if (!dryRun) {
    const { error } = await db.storage
      .from("agent-photos")
      .upload(photoPath, bytes, { contentType: type, upsert: false });
    if (error) throw new Error(`photo upload failed: ${error.message}`);
  }
}

// A new slug keeps the old one forwarding.
const previousSlugs = existing
  ? [...new Set([...(existing.previous_slugs ?? []), existing.slug])].filter((s) => s !== input.slug)
  : [];

const row = {
  agent_id: agent.id,
  slug: input.slug,
  previous_slugs: previousSlugs,
  published: input.published,
  is_example: input.isExample,
  display_name: input.displayName,
  photo_path: photoPath,
  default_lang: input.defaultLang,
  spoken_languages: input.spokenLanguages,
  native_language: input.nativeLanguage ?? null,
  areas: input.areas,
  helps: input.helps,
  since_year: input.sinceYear ?? null,
  works: input.works,
  agency_name: input.works === "agency" ? (input.agencyName ?? null) : null,
  whatsapp: input.whatsapp ?? null,
  content: input.content,
};

if (dryRun) {
  console.log("dry run, nothing written:", JSON.stringify(row, null, 2));
  process.exit(0);
}

const { data: saved, error: saveError } = existing
  ? await db.from("agent_pages").update(row).eq("id", existing.id).select("*").single()
  : await db.from("agent_pages").insert(row).select("*").single();
if (saveError) {
  console.error(
    saveError.message.includes("agent_page_slug_taken") || saveError.code === "23505"
      ? `✗ The slug "${input.slug}" (or an old slug of this page) belongs to another page.`
      : `✗ ${saveError.message}`
  );
  process.exit(1);
}

// The replaced photo is no longer referenced anywhere.
if (input.photo && existing?.photo_path && existing.photo_path !== photoPath) {
  await db.storage.from("agent-photos").remove([existing.photo_path]);
}

const page = pageFromRow(saved, `${url}/storage/v1/object/public/agent-photos`);
if (!page) {
  console.error("✗ Saved, but the page can't be shown: check the default language's text.");
  process.exit(1);
}

console.log(`${existing ? "Updated" : "Created"} ${page.displayName}'s page (${page.published ? "published" : "not published"}${page.isExample ? ", example" : ""}):`);
const indexable: string[] = [];
for (const lang of page.langs) {
  const address = `${INDEXNOW_ORIGIN}${agentPath(page.slug, lang, page.defaultLang)}`;
  const ok = isIndexable(page, lang);
  if (ok) indexable.push(address);
  const why = page.isExample
    ? "an example page"
    : !page.published
      ? "not published"
      : "needs a photo, areas and a bio of 80+ characters";
  console.log(`  ${lang}  ${address}${ok ? "" : `  (hidden from search: ${why})`}`);
}
if (previousSlugs.length) console.log(`  forwarding: ${previousSlugs.map((s) => `/agent/${s}`).join(", ")}`);

if (indexable.length) {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(indexNowBody(indexable)),
  });
  console.log(`IndexNow: ${indexable.length} URL(s) → HTTP ${response.status}`);
}
