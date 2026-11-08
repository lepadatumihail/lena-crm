import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { WING_PATHS, WING_VIEWBOX, WORDMARK_PATHS, WORDMARK_VIEWBOX } from "@/lib/brand-mark";
import { BRAND, SITE_URL } from "@/lib/site";

import { agentPath, type AgentPage, type PageLang } from "./content";
import { PAGE_COPY, fill, languageName } from "./copy";

export const AGENT_OG_SIZE = { width: 1200, height: 630 };

function font(file: string) {
  return readFile(join(process.cwd(), "assets/fonts", file));
}

/**
 * The link preview WhatsApp, Facebook and LinkedIn show when an agent shares
 * their page: face (or initials), name, what they do and where, the
 * languages, and the address. In the page's language, so a Swedish link
 * previews in Swedish. No page (unpublished, or a typo) gets a plain card.
 */
export async function agentOgImage(page: AgentPage | null, lang: PageLang | null) {
  const [regular, medium] = await Promise.all([font("Geist-Regular.ttf"), font("Geist-Medium.ttf")]);
  const fonts = [
    { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: medium, weight: 500 as const, style: "normal" as const },
  ];
  const host = new URL(SITE_URL).host.replace(/^www\./, "");

  const logo = (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width="46" height="36" viewBox={WING_VIEWBOX} fill={BRAND.primary}>
        {WING_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
      <svg width="132" height="30" viewBox={WORDMARK_VIEWBOX} fill={BRAND.foreground}>
        {WORDMARK_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    </div>
  );

  if (!page || !lang) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: BRAND.background,
            fontFamily: "Geist",
          }}
        >
          {logo}
        </div>
      ),
      { ...AGENT_OG_SIZE, fonts }
    );
  }

  const copy = PAGE_COPY[lang];
  const text = page.content[lang] ?? page.content[page.defaultLang];
  const role =
    text?.title ?? (page.areas[0] ? fill(copy.defaultTitle, { area: page.areas[0] }) : copy.jobTitle);
  const languages = page.spokenLanguages.map((code) => languageName(code, lang));
  const initials = page.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase(lang))
    .join("");
  const address = `${host}${agentPath(page.slug, lang, page.defaultLang)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: BRAND.background,
          color: BRAND.foreground,
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          {page.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img only
            <img
              src={page.photoUrl}
              alt=""
              width={220}
              height={220}
              style={{ width: 220, height: 220, borderRadius: 999, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: BRAND.indigoSoft,
                color: BRAND.indigoInk,
                fontSize: 92,
                fontWeight: 500,
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 760 }}>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 500, lineHeight: 1.05, letterSpacing: -1.5 }}>
              {page.displayName}
            </div>
            <div style={{ display: "flex", fontSize: 38, lineHeight: 1.2, color: "#3a3a3a" }}>
              {role.charAt(0).toLocaleUpperCase(lang) + role.slice(1)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
              {languages.map((l) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    padding: "6px 18px",
                    borderRadius: 999,
                    background: BRAND.mutedSurface,
                    fontSize: 26,
                    color: BRAND.foreground,
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {logo}
          <div style={{ display: "flex", fontSize: 26, color: BRAND.muted }}>{address}</div>
        </div>
      </div>
    ),
    { ...AGENT_OG_SIZE, fonts }
  );
}
