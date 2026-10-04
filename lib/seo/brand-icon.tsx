import { ImageResponse } from "next/og";
import { markSvg } from "@/lib/brand/mark";

/**
 * PNG versions of the TabBench mark (lib/brand/mark.ts), rendered at
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

function markSvgFor(variant: Variant): string {
  // Scale the glyph about the centre so its corners clear the safe zone.
  return variant === "rounded" ? markSvg() : markSvg({ radius: 0, glyphScale: 0.82 });
}

export function renderBrandIcon(size: number, variant: Variant) {
  const src = `data:image/svg+xml;base64,${Buffer.from(markSvgFor(variant)).toString("base64")}`;
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
