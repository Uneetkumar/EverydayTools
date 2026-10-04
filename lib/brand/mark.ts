/**
 * The TabBench mark, defined once: a T-handle socket wrench.
 *
 * - The T is the "T" of TabBench, and a real tool (a tee wrench), so the letter
 *   and the workbench are the same shape.
 * - The handle is a browser tab, with the new-tab "+" on its end.
 * - The hex socket at the tip is the bench's tool, in the site's sky accent.
 *
 * Flat and gradient-free on purpose: ids from gradients collide when the mark is
 * inlined several times on one page, and flat reads better at 16px.
 *
 * Every copy of the logo derives from here: the site header and footer
 * (components/layout/logo.tsx), the PNG icons (lib/seo/brand-icon.tsx), the
 * browser extension, and the static favicon.ico / icon.svg that
 * `npm run brand:icons` writes. Change the mark here, then re-run that script.
 */
export const MARK = {
  /** Side of the square viewBox every shape below is drawn in. */
  size: 64,
  radius: 16,
  /** The tile. Matches the web manifest's background_color. */
  background: "#0f172a",
  handle: "#ffffff",
  tool: "#7dd3fc",
} as const;

// Pointy-top hexagon, centre (32, 46), circumradius 8.6; drawn with a round-joined stroke to soften the corners.
const SOCKET = Array.from({ length: 6 }, (_, i) => {
  const angle = (Math.PI / 3) * i - Math.PI / 2;
  return `${(32 + 8.6 * Math.cos(angle)).toFixed(2)},${(46 + 8.6 * Math.sin(angle)).toFixed(2)}`;
}).join(" ");

type MarkOptions = {
  /** Corner radius of the tile. 0 for icons the OS masks itself (iOS, Android maskable). */
  radius?: number;
  /** Shrinks the glyph about the centre, to keep it inside a maskable icon's safe zone. */
  glyphScale?: number;
};

/** The mark's SVG elements, to drop into a `viewBox="0 0 64 64"` svg. */
export function markSvgBody({ radius = MARK.radius, glyphScale = 1 }: MarkOptions = {}): string {
  const { size, background, handle, tool } = MARK;
  const c = size / 2;
  const glyphTransform = glyphScale === 1 ? "" : ` transform="translate(${c} ${c}) scale(${glyphScale}) translate(${-c} ${-c})"`;
  // The hairline keeps the tile's edge visible on dark pages; at favicon size it is sub-pixel.
  const rim =
    radius > 0
      ? `<rect x=".75" y=".75" width="${size - 1.5}" height="${size - 1.5}" rx="${radius - 0.75}" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="1.5"/>`
      : "";
  return (
    `<rect width="${size}" height="${size}" rx="${radius}" fill="${background}"/>${rim}` +
    `<g${glyphTransform}>` +
    `<rect x="27.5" y="19" width="9" height="20" fill="${tool}"/>` +
    `<polygon points="${SOCKET}" fill="${tool}" stroke="${tool}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<circle cx="32" cy="46" r="3.1" fill="${background}"/>` +
    `<rect x="9" y="9" width="46" height="12" rx="6" fill="${handle}"/>` +
    `<path d="M49 12.2v5.6M46.2 15h5.6" stroke="${background}" stroke-width="1.8" stroke-linecap="round"/>` +
    `</g>`
  );
}

/** A standalone SVG document of the mark. */
export function markSvg(options: MarkOptions & { pixels?: number } = {}): string {
  const { pixels, ...rest } = options;
  const dimensions = pixels ? ` width="${pixels}" height="${pixels}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK.size} ${MARK.size}"${dimensions}>${markSvgBody(rest)}</svg>`;
}
