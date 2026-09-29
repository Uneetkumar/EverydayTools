/**
 * Favicons as sites need them today (see Evil Martians, "How to Favicon"):
 *
 *   favicon.ico           16, 32 and 48 px in one file — what browsers, RSS
 *                         readers and Google Search ask for at /favicon.ico
 *   icon.svg              the logo itself, when it is an SVG
 *   apple-touch-icon.png  180 px on a solid background: iOS turns
 *                         transparent pixels black
 *   icon-192.png, icon-512.png            for the web app manifest
 *   icon-maskable-512.png                 padded so Android's round or
 *                                         squircle crop can't clip the logo
 */

export type Shape = "square" | "rounded" | "circle";

export interface IconStyle {
  /** CSS colour, or "transparent". */
  background: string;
  /** Empty space around the logo, as a fraction of the icon (0–0.3). */
  padding: number;
  shape: Shape;
}

type Source = HTMLImageElement | HTMLCanvasElement;

/** An SVG without width and height can report 0×0; treat it as a square. */
const dims = (s: Source) => {
  const w = s instanceof HTMLImageElement ? s.naturalWidth || s.width : s.width;
  const h = s instanceof HTMLImageElement ? s.naturalHeight || s.height : s.height;
  return w && h ? { w, h } : { w: 1024, h: 1024 };
};

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return [c, ctx];
}

/**
 * Shrinks in halving steps. Drawing a 1024 px logo straight onto 16 px
 * skips most of its pixels and looks jagged; halving each time averages them.
 */
function downscale(src: Source, target: number): Source {
  let cur: Source = src;
  let { w, h } = dims(src);
  while (Math.max(w, h) / 2 >= target * 1.5) {
    w = Math.max(1, Math.round(w / 2));
    h = Math.max(1, Math.round(h / 2));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(cur, 0, 0, w, h);
    cur = c;
  }
  return cur;
}

function shapePath(ctx: CanvasRenderingContext2D, size: number, shape: Shape) {
  ctx.beginPath();
  if (shape === "circle") ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  else if (shape === "rounded") {
    const r = size * 0.22;
    ctx.moveTo(r, 0);
    ctx.arcTo(size, 0, size, size, r);
    ctx.arcTo(size, size, 0, size, r);
    ctx.arcTo(0, size, 0, 0, r);
    ctx.arcTo(0, 0, size, 0, r);
    ctx.closePath();
  } else ctx.rect(0, 0, size, size);
}

/**
 * One square icon: background shape, then the logo centred and fitted inside
 * the padding. `vector` sources (SVG) are drawn straight at the final size,
 * which the browser rasterises sharply.
 */
export function drawIcon(src: Source, size: number, style: IconStyle, vector = false): HTMLCanvasElement {
  const [c, ctx] = canvas(size);
  if (style.background !== "transparent") {
    ctx.fillStyle = style.background;
    shapePath(ctx, size, style.shape);
    ctx.fill();
  }
  if (style.shape !== "square") {
    shapePath(ctx, size, style.shape);
    ctx.clip();
  }
  const inner = size * (1 - 2 * Math.min(0.3, Math.max(0, style.padding)));
  const { w, h } = dims(src);
  const scale = Math.min(inner / w, inner / h);
  const dw = w * scale;
  const dh = h * scale;
  ctx.drawImage(vector ? src : downscale(src, Math.max(dw, dh)), (size - dw) / 2, (size - dh) / 2, dw, dh);
  return c;
}

/** A letter or emoji on a coloured tile, for sites without a logo. Drawn large, then scaled like any logo. */
export function textSource(text: string, color: string, font = "system-ui, -apple-system, 'Segoe UI', sans-serif"): HTMLCanvasElement {
  const [c, ctx] = canvas(1024);
  const t = [...text.trim()].slice(0, 3).join("") || "A";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let px = 900;
  ctx.font = `700 ${px}px ${font}`;
  while (px > 80 && ctx.measureText(t).width > 900) {
    px -= 20;
    ctx.font = `700 ${px}px ${font}`;
  }
  // Centre on the glyphs' real bounds, not the font's line box.
  const m = ctx.measureText(t);
  const top = m.actualBoundingBoxAscent;
  const bottom = m.actualBoundingBoxDescent;
  ctx.fillText(t, 512, 512 + (top - bottom) / 2);
  return c;
}

export function toPng(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encoding failed"))), "image/png"));
}

/**
 * An .ico file holding PNG images (supported by every browser and by
 * Windows since Vista). Header, one 16-byte directory entry per image, then
 * the PNG data.
 */
export function encodeIco(images: { size: number; png: Uint8Array }[]): Uint8Array {
  const headerSize = 6 + 16 * images.length;
  const total = headerSize + images.reduce((n, i) => n + i.png.length, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // 1 = icon
  view.setUint16(4, images.length, true);
  let offset = headerSize;
  images.forEach((img, i) => {
    const e = 6 + i * 16;
    out[e] = img.size >= 256 ? 0 : img.size; // 0 means 256
    out[e + 1] = img.size >= 256 ? 0 : img.size;
    out[e + 2] = 0; // no palette
    out[e + 3] = 0;
    view.setUint16(e + 4, 1, true); // colour planes
    view.setUint16(e + 6, 32, true); // bits per pixel
    view.setUint32(e + 8, img.png.length, true);
    view.setUint32(e + 12, offset, true);
    out.set(img.png, offset);
    offset += img.png.length;
  });
  return out;
}

export interface ManifestOptions {
  name: string;
  themeColor: string;
  backgroundColor: string;
}

export function manifest(o: ManifestOptions): string {
  const name = o.name.trim() || "My site";
  return JSON.stringify(
    {
      name,
      short_name: name.length > 12 ? name.slice(0, 12).trim() : name,
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      theme_color: o.themeColor,
      background_color: o.backgroundColor,
      display: "standalone",
    },
    null,
    2
  );
}

export function headTags(o: { svg: boolean; themeColor: string }): string {
  return [
    '<link rel="icon" href="/favicon.ico" sizes="32x32">',
    ...(o.svg ? ['<link rel="icon" href="/icon.svg" type="image/svg+xml">'] : []),
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    `<meta name="theme-color" content="${o.themeColor}">`,
  ].join("\n");
}

/** Whether a colour is light, to pick readable text and preview backgrounds. */
export function isLight(color: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}
