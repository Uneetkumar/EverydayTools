import { ImageResponse } from "next/og";

/**
 * Shared Open Graph card.
 *
 * Every section that renders a social preview goes through here so the cards
 * stay visually identical as sections are added. The design matches the tool
 * cards that were already shipping, so existing previews are unchanged.
 *
 * Note for `output: "export"`: each route that uses this must also declare
 * `export const dynamic = "force-static"` and, when dynamic, its own
 * `generateStaticParams` — the PNGs are rendered at build time.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export function renderOgImage({
  eyebrow,
  title,
  subtitle,
  footer = "Free · No signup · Runs entirely in your browser",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  footer?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 600,
            color: "#93c5fd",
          }}
        >
          {eyebrow}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 24,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#cbd5e1",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#94a3b8" }}>
          {footer}
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}

/**
 * OG cards are 1200x630 and the title renders at 68px, so long strings wrap
 * into the subtitle and push the layout. Trim on a word boundary instead.
 */
export function clampForOg(text: string, max: number) {
  const t = (text ?? "").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).trim() + "…";
}
