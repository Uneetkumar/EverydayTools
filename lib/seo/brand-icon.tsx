import { ImageResponse } from "next/og";

/**
 * PNG versions of the TabBench mark (components/layout/logo.tsx), rendered at
 * build time. iOS ignores SVG touch icons, Android's install prompt wants
 * 192/512 PNGs, and Google asks for a raster Organization logo — the SVG
 * favicon alone covered none of these.
 *
 * - "rounded": the mark as the site shows it (manifest "any", logo).
 * - "full-bleed": square, no corner radius — iOS and Android apply their own
 *   mask. The glyph is shrunk to stay inside the maskable safe zone (the
 *   centre 80% circle).
 */
type Variant = "rounded" | "full-bleed";

function markSvg(variant: Variant): string {
  const rx = variant === "rounded" ? 8 : 0;
  // Scale the glyph about the centre so its corners clear the safe zone.
  const glyph = variant === "full-bleed" ? 'transform="translate(16 16) scale(.82) translate(-16 -16)"' : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="${rx}" fill="#2563eb"/>
<g ${glyph}>
<rect x="7" y="7" width="18" height="6" rx="1.75" fill="#fff" fill-opacity=".28"/>
<rect x="7" y="15.5" width="4.5" height="4" rx="1.25" fill="#fff"/>
<rect x="13.75" y="15.5" width="4.5" height="4" rx="1.25" fill="#fff"/>
<rect x="20.5" y="15.5" width="4.5" height="4" rx="1.25" fill="#fff"/>
<rect x="7" y="21.5" width="4.5" height="4" rx="1.25" fill="#fff"/>
<rect x="13.75" y="21.5" width="4.5" height="4" rx="1.25" fill="#fff"/>
<rect x="20.5" y="21.5" width="4.5" height="4" rx="1.25" fill="#38bdf8"/>
</g>
</svg>`;
}

export function renderBrandIcon(size: number, variant: Variant) {
  const src = `data:image/svg+xml;base64,${Buffer.from(markSvg(variant)).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG by ImageResponse, not a page image */}
        <img src={src} width={size} height={size} alt="" />
      </div>
    ),
    { width: size, height: size }
  );
}
