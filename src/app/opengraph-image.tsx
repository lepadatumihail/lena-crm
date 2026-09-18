import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  WING_PATHS,
  WING_VIEWBOX,
  WORDMARK_PATHS,
  WORDMARK_VIEWBOX,
} from "@/lib/brand-mark";
import {
  BRAND,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TAGLINE_LINES = ["The CRM for", "independent", "real-estate agents"];
const STAGES = ["New", "Contacted", "Qualified", "Viewing", "Reserved"];
const ROWS = [
  { initials: "SM", name: "Sofia Martín", stage: "Viewing", when: "Tomorrow 11:00" },
  { initials: "JH", name: "James Holt", stage: "Qualified", when: "Follow up today" },
  { initials: "AK", name: "Anna Karlsson", stage: "Reserved", when: "Deposit paid" },
];

function font(file: string) {
  return readFile(join(process.cwd(), "assets/fonts", file));
}

export default async function Image() {
  const [regular, medium, bold] = await Promise.all([
    font("Geist-Regular.ttf"),
    font("Geist-Medium.ttf"),
    font("Geist-Bold.ttf"),
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
        {/* Warm glows, echoing the landing hero */}
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -160,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at center, rgba(192,96,63,0.22) 0%, rgba(192,96,63,0) 65%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -260,
            left: -120,
            width: 640,
            height: 640,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at center, rgba(222,176,92,0.18) 0%, rgba(222,176,92,0) 65%)",
          }}
        />

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
                fontWeight: 700,
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
              color: BRAND.primary,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: BRAND.primary,
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
              boxShadow: "0 30px 70px rgba(43,41,38,0.12)",
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
              <div style={{ fontSize: 24, fontWeight: 700, display: "flex" }}>
                Buyers
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: BRAND.muted,
                  display: "flex",
                }}
              >
                3 agencies · one place
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STAGES.map((s, i) => (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    fontSize: 15,
                    fontWeight: 500,
                    padding: "6px 12px",
                    borderRadius: 9999,
                    background: i === 3 ? BRAND.primary : BRAND.primarySoft,
                    color: i === 3 ? BRAND.background : BRAND.primary,
                  }}
                >
                  {s}
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
                    background: BRAND.background,
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
                      background: BRAND.primarySoft,
                      color: BRAND.primary,
                      fontSize: 16,
                      fontWeight: 700,
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
                      padding: "5px 10px",
                      borderRadius: 9999,
                      background: BRAND.primarySoft,
                      color: BRAND.primary,
                    }}
                  >
                    {r.stage}
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
        { name: "Geist", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}
