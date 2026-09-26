import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  WING_PATHS,
  WING_VIEWBOX,
  WORDMARK_PATHS,
  WORDMARK_VIEWBOX,
} from "@/lib/brand-mark";
import { STAGE_TONES, type BuyerStage } from "@/lib/crm";
import {
  BRAND,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";
import type { Tone } from "@/lib/tones";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TAGLINE_LINES = ["The CRM for", "independent", "real-estate agents"];
// Four stages fit the card on one line; Reserved, the fifth, shows on
// Anna's row below, so the strip never wraps a lone pill onto a second line.
const STAGES: { stage: BuyerStage; label: string }[] = [
  { stage: "new", label: "New" },
  { stage: "contacted", label: "Contacted" },
  { stage: "qualified", label: "Qualified" },
  { stage: "viewing", label: "Viewing" },
];
const ROWS: { initials: string; name: string; stage: BuyerStage; label: string; when: string }[] = [
  { initials: "SM", name: "Sofia Martín", stage: "viewing", label: "Viewing", when: "Tomorrow 11:00" },
  { initials: "JH", name: "James Holt", stage: "qualified", label: "Qualified", when: "Follow up today" },
  { initials: "AK", name: "Anna Karlsson", stage: "reserved", label: "Reserved", when: "Deposit paid" },
];

/**
 * The app's Tag in hex: a pale fill with dark same-hue text, an outline for
 * neutral, a grey fill for grey, solid ink for ink. Stage tones come from
 * STAGE_TONES, so the card shows the pills the app does.
 */
// Every tone, so a stage that changes tone can never fall back silently.
const TAG: Record<Tone, { background: string; color: string; border: string }> = {
  neutral: { background: BRAND.card, color: BRAND.foreground, border: BRAND.border },
  grey: { background: BRAND.mutedSurface, color: BRAND.foreground, border: BRAND.mutedSurface },
  blue: { background: BRAND.blueSoft, color: BRAND.blueInk, border: BRAND.blueSoft },
  green: { background: BRAND.greenSoft, color: BRAND.greenInk, border: BRAND.greenSoft },
  amber: { background: BRAND.amberSoft, color: BRAND.amberInk, border: BRAND.amberSoft },
  red: { background: BRAND.redSoft, color: BRAND.redInk, border: BRAND.redSoft },
  violet: { background: BRAND.violetSoft, color: BRAND.violetInk, border: BRAND.violetSoft },
  ink: { background: BRAND.foreground, color: BRAND.background, border: BRAND.foreground },
};
const tagStyle = (stage: BuyerStage) => {
  const { background, color, border } = TAG[STAGE_TONES[stage]];
  return { background, color, border: `1px solid ${border}` };
};

function font(file: string) {
  return readFile(join(process.cwd(), "assets/fonts", file));
}

export default async function Image() {
  const [regular, medium] = await Promise.all([
    font("Geist-Regular.ttf"),
    font("Geist-Medium.ttf"),
  ]);
  const host = new URL(SITE_URL).host;
  const summary = SITE_DESCRIPTION.split(". ")[1] ?? SITE_TAGLINE;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: BRAND.background,
          fontFamily: "Geist",
          color: BRAND.foreground,
          overflow: "hidden",
        }}
      >
        {/* Left: brand */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 640,
            padding: "64px 0 56px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="96" height="84" viewBox={WING_VIEWBOX} fill={BRAND.foreground}>
              {WING_PATHS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </svg>
            <svg
              width="350"
              height="80"
              viewBox={WORDMARK_VIEWBOX}
              fill={BRAND.foreground}
            >
              {WORDMARK_PATHS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 50,
                fontWeight: 500,
                lineHeight: 1.08,
                letterSpacing: -1.5,
              }}
            >
              {/* Explicit lines so the headline never breaks at "real-estate". */}
              {TAGLINE_LINES.map((line) => (
                <div key={line} style={{ display: "flex" }}>
                  {line}
                </div>
              ))}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 400,
                lineHeight: 1.4,
                color: BRAND.muted,
                display: "flex",
                maxWidth: 560,
              }}
            >
              {summary}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 26,
              fontWeight: 500,
              color: BRAND.foreground,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: BRAND.foreground,
                display: "flex",
              }}
            />
            {host}
          </div>
        </div>

        {/* Right: a glimpse of the pipeline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            flexGrow: 1,
            paddingRight: 64,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 440,
              background: BRAND.card,
              border: `2px solid ${BRAND.border}`,
              borderRadius: 28,
              boxShadow: "0 30px 70px rgba(23,23,23,0.10)",
              padding: 28,
              gap: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 500, display: "flex" }}>
                Buyers
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  color: BRAND.muted,
                  display: "flex",
                }}
              >
                3 agencies · one place
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {STAGES.map(({ stage, label }) => (
                <div
                  key={stage}
                  style={{
                    display: "flex",
                    fontSize: 15,
                    fontWeight: 500,
                    padding: "5px 12px",
                    borderRadius: 9999,
                    ...tagStyle(stage),
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ROWS.map((r) => (
                <div
                  key={r.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 14px",
                    borderRadius: 16,
                    background: BRAND.card,
                    border: `1px solid ${BRAND.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 44,
                      height: 44,
                      borderRadius: 9999,
                      background: BRAND.mutedSurface,
                      color: BRAND.foreground,
                      fontSize: 16,
                      fontWeight: 500,
                    }}
                  >
                    {r.initials}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <div style={{ fontSize: 19, fontWeight: 500, display: "flex" }}>
                      {r.name}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: BRAND.muted,
                        display: "flex",
                      }}
                    >
                      {r.when}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 14,
                      fontWeight: 500,
                      padding: "4px 10px",
                      borderRadius: 9999,
                      ...tagStyle(r.stage),
                    }}
                  >
                    {r.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist", data: medium, weight: 500, style: "normal" },
      ],
    }
  );
}
